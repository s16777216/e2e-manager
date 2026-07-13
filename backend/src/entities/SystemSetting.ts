import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class SystemSetting {
  @PrimaryColumn("varchar", { default: "default" })
  id: string = "default";

  @Column("boolean", { default: true })
  headless!: boolean;

  @Column("integer", { default: 1280 })
  viewportWidth!: number;

  @Column("integer", { default: 800 })
  viewportHeight!: number;

  @Column("integer", { default: 0 })
  slowMo!: number;

  @Column("integer", { default: 10000 })
  defaultTimeout!: number;

  @Column("jsonb", { nullable: true })
  aiConfig?: {
    provider?: string;
    executorProvider?: string;
    apiKey?: string;
    baseUrl?: string;
    openaiApiKey?: string;
    geminiModel?: string;
    openaiModel?: string;
    summarizerGeminiModel?: string;
    summarizerOpenaiModel?: string;
    sendFailureScreenshot?: boolean;
  };

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
