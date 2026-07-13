import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { TestGroup } from "./TestGroup.js";
import { TestRun } from "./TestRun.js";
import { TestcaseStep } from "./TestcaseStep.js";

@Entity()
export class Testcase {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @OneToMany(() => TestcaseStep, step => step.testcase, { cascade: true })
  steps!: TestcaseStep[];

  @Column("text")
  expected!: string;

  @ManyToOne(() => TestGroup, group => group.testcases, { onDelete: "CASCADE" })
  group!: any;

  @OneToMany(() => TestRun, run => run.testcase)
  runs!: TestRun[];

  @Column("jsonb", { nullable: true })
  initCookies?: any;

  @Column("jsonb", { nullable: true })
  initLocalStorage?: any;

  @Column("jsonb", { nullable: true })
  variables?: any;

  @Column("text", { nullable: true })
  systemPrompt?: string;

  @Column("boolean", { default: false })
  disableParentPrompt?: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
