import { useState, useEffect, useRef } from "react"
import { api } from "../lib/api"
import type { TestLog, TestRun, TestRunStep } from "../types/api"
import { toast } from "sonner"

export function useSSEStream(runId: string | undefined) {
  const [runStatus, setRunStatus] = useState<TestRun | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const triggerRun = async (testcaseId: string) => {
    try {
      setRunStatus(null)

      const res = await api.triggerRun(testcaseId)
      toast.success("測試已啟動，正在載入執行環境...")
      return res.taskId
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error("啟動測試失敗：" + msg)
      return null
    }
  }

  const subscribeToSSE = (rId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const streamUrl = api.getStreamUrl(rId)
    const eventSource = new EventSource(streamUrl)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.runId !== rId) return

        if (payload.event === "queued") {
          setRunStatus(prev => prev ? { ...prev, status: "pending" } : {
            id: rId,
            status: "pending",
            steps: []
          })
        } else if (payload.event === "step_status") {
          setRunStatus(prev => {
            const run = prev || { id: rId, status: "running", steps: [] }
            const steps = [...(run.steps || [])]
            const existingIndex = steps.findIndex(s => s.stepIdx === payload.stepIdx)

            const updatedStep: TestRunStep = {
              id: payload.stepId,
              stepIdx: payload.stepIdx,
              stepDescription: payload.stepDescription,
              status: payload.status,
              promptTokens: payload.promptTokens ?? 0,
              completionTokens: payload.completionTokens ?? 0,
              totalTokens: payload.totalTokens ?? 0,
              screenshotUrl: payload.status === "passed" || payload.status === "failed"
                ? `/api/steps/${payload.stepId}/screenshot`
                : null,
              logs: existingIndex > -1 ? (steps[existingIndex].logs || []) : []
            }

            if (existingIndex > -1) {
              steps[existingIndex] = {
                ...steps[existingIndex],
                ...updatedStep
              }
            } else {
              steps.push(updatedStep)
            }

            return {
              ...run,
              status: payload.status === "failed" || payload.status === "error" ? "failed" : "running",
              steps: steps.sort((a, b) => a.stepIdx - b.stepIdx)
            }
          })
        } else if (payload.event === "log") {
          setRunStatus(prev => {
            const run = prev || { id: rId, status: "running", steps: [] }
            const steps = [...(run.steps || [])]
            const existingIndex = steps.findIndex(s => s.stepIdx === payload.stepIdx)

            const newLog: TestLog = {
              id: payload.logId,
              action: payload.action,
              result: payload.result,
              aiResponse: payload.aiResponse,
              promptTokens: payload.promptTokens,
              completionTokens: payload.completionTokens,
              totalTokens: payload.totalTokens
            }

            if (existingIndex > -1) {
              const logs = [...(steps[existingIndex].logs || [])]
              if (!logs.some(l => l.id === newLog.id)) {
                logs.push(newLog)
              }
              steps[existingIndex] = {
                ...steps[existingIndex],
                logs
              }
            } else {
              steps.push({
                id: payload.stepId,
                stepIdx: payload.stepIdx,
                stepDescription: payload.stepDescription || "",
                status: "running",
                logs: [newLog]
              })
            }

            return {
              ...run,
              status: "running",
              steps: steps.sort((a, b) => a.stepIdx - b.stepIdx)
            }
          })
        } else if (payload.event === "completed") {
          setRunStatus(prev => {
            const run = prev || { id: rId, steps: [] }
            return {
              ...run,
              status: payload.status,
              finalResult: payload.finalResult,
              finalReason: payload.finalReason,
              failureSummary: payload.failureSummary,
              totalPromptTokens: payload.totalPromptTokens,
              totalCompletionTokens: payload.totalCompletionTokens,
              totalTokens: payload.totalTokens,
              screenshotFailUrl: payload.status !== "passed" ? `/api/runs/${rId}/screenshots/fail` : undefined
            }
          })
          eventSource.close()
          eventSourceRef.current = null
        }
      } catch (err) {
        console.error("[SSE] 解析資料出錯：", err)
      }
    }

    eventSource.onerror = () => {
      console.warn("[SSE] 連線中斷或伺服器關閉。")
      eventSource.close()
    }
  }

  useEffect(() => {
    let active = true

    const initRun = async (rId: string) => {
      Promise.resolve().then(() => {
        if (active) {
          setRunStatus(null)
        }
      })

      try {
        const runData = await api.getRunStatus(rId)
        if (!active) return

        if (runData) {
          setRunStatus(runData)
          if (runData.status === "pending" || runData.status === "running") {
            subscribeToSSE(rId)
          }
        } else {
          subscribeToSSE(rId)
        }
      } catch (err) {
        console.error("載入執行歷史失敗，嘗試直接訂閱 SSE：", err)
        if (active) {
          subscribeToSSE(rId)
        }
      }
    }

    if (runId) {
      initRun(runId)
    } else {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      Promise.resolve().then(() => {
        if (active) {
          setRunStatus(null)
        }
      })
    }

    return () => {
      active = false
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [runId])

  return {
    runStatus,
    triggerRun
  }
}
