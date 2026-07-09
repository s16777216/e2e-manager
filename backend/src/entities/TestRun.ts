import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Relation } from "typeorm";
import { Testcase } from "./Testcase.js";
import { TestRunStep } from "./TestRunStep.js";
import { Task } from "./Task.js";

@Entity()
export class TestRun {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar", { default: "pending" })
  status!: string; // pending | running | passed | failed | error

  @Column("timestamptz", { nullable: true })
  startedAt?: Date;

  @Column("timestamptz", { nullable: true })
  finishedAt?: Date;

  @Column("varchar", { nullable: true })
  finalResult?: string;

  @Column("text", { nullable: true })
  finalReason?: string;

  @Column({ type: "bytea", nullable: true, select: false })
  screenshotFailData?: Buffer;

  @Column("jsonb", { nullable: true })
  failureSummary?: {
    reason: string;
    suggestion: string;
  };


  @Column("integer", { default: 0 })
  totalPromptTokens!: number;

  @Column("integer", { default: 0 })
  totalCompletionTokens!: number;

  @Column("integer", { default: 0 })
  totalTokens!: number;

  @ManyToOne(() => Testcase, testcase => testcase.runs, { onDelete: "CASCADE" })
  testcase!: any;

  @OneToMany(() => TestRunStep, step => step.run)
  steps!: TestRunStep[];

  @ManyToOne(() => Task, task => task.runs, { nullable: true, onDelete: "SET NULL" })
  task!: Relation<Task> | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}

