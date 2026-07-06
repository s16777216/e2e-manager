import { useState, useEffect } from "react"
import { api } from "../lib/api"
import type { Testcase } from "../types/api"
import { toast } from "sonner"

export function useTestcaseData(groupId: string | undefined) {
  const [testcases, setTestcases] = useState<Testcase[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadTestcases = async (gId: string) => {
    setIsLoading(true)
    try {
      const data = await api.getTestcases(gId)
      setTestcases(data)
    } catch (err) {
      console.error(err)
      toast.error("載入測試案例失敗")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTestcase = async (
    testcaseId: string | null,
    name: string,
    steps: Array<{ action: string; expected?: string; hasExpected?: boolean }>,
    expected: string
  ) => {
    if (!groupId) return null
    if (!name.trim() || steps.some(s => !s.action.trim())) {
      toast.error("請填寫所有必填欄位，且步驟不可為空！")
      return null
    }

    try {
      let result: Testcase
      const formattedSteps = steps.map(s => ({
        action: s.action.trim(),
        expected: s.hasExpected ? (s.expected?.trim() || "") : "",
        hasExpected: !!s.hasExpected
      }))

      if (testcaseId) {
        result = await api.updateTestcase(testcaseId, {
          name: name.trim(),
          steps: formattedSteps,
          expected: expected.trim()
        })
        toast.success("測試案例修改成功！")
      } else {
        result = await api.createTestcase(groupId, {
          name: name.trim(),
          steps: formattedSteps,
          expected: expected.trim()
        })
        toast.success("測試案例建立成功！")
      }
      await loadTestcases(groupId)
      return result
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error("儲存測試案例失敗：" + msg)
      return null
    }
  }

  const handleDeleteTestcase = async (testcaseId: string) => {
    try {
      await api.deleteTestcase(testcaseId)
      if (groupId) {
        await loadTestcases(groupId)
      }
      toast.success("測試案例刪除成功！")
      return true
    } catch (err) {
      toast.error("刪除測試案例失敗：" + err)
      return false
    }
  }

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) {
        if (groupId) {
          loadTestcases(groupId)
        } else {
          setTestcases([])
        }
      }
    })
    return () => {
      active = false
    }
  }, [groupId])

  return {
    testcases,
    isLoading,
    loadTestcases,
    handleSaveTestcase,
    handleDeleteTestcase
  }
}
