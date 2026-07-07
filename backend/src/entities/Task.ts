import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { TestRun } from "./TestRun.js";

@Entity()
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  scope!: "project" | "group" | "testcase";

  @Column("varchar")
  scopeId!: string;

  @Column("varchar", { default: "pending" })
  status!: "pending" | "running" | "passed" | "failed" | "error";

  @Column("int")
  totalCount!: number;

  @Column("int", { default: 0 })
  doneCount!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @Column("timestamptz", { nullable: true })
  finishedAt!: Date | null;

  @OneToMany(() => TestRun, run => run.task)
  runs!: TestRun[];
}
