import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class ModelSetting {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("varchar", { default: "" })
  description!: string;

  /** "google" | "openai" */
  @Column("varchar")
  provider!: string;

  @Column("varchar", { default: "" })
  apiKey!: string;

  /** OpenAI Compatible Base URL（google 時留空） */
  @Column("varchar", { default: "" })
  baseUrl!: string;

  @Column("varchar")
  model!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
