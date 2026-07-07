import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Relation } from "typeorm";
import { TestRun } from "./TestRun.js";
import { TestLog } from "./TestLog.js";

@Entity()
export class TestRunStep {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("integer")
  stepIdx!: number;

  @Column("text")
  stepDescription!: string;

  @Column("varchar", { default: "pending" })
  status!: string; // pending | running | passed | failed | error

  @Column({ type: "bytea", nullable: true, select: false })
  screenshotData?: Buffer;

  @Column("integer", { default: 0 })
  promptTokens!: number;

  @Column("integer", { default: 0 })
  completionTokens!: number;

  @Column("integer", { default: 0 })
  totalTokens!: number;

  @ManyToOne(() => TestRun, run => run.steps, { onDelete: "CASCADE" })
  run!: Relation<TestRun>;

  @OneToMany(() => TestLog, log => log.step)
  logs!: TestLog[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
