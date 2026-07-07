import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Relation } from "typeorm";
import { Testcase } from "./Testcase.js";

@Entity()
export class TestcaseStep {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("integer")
  stepIdx!: number;

  @Column("text")
  action!: string;

  @Column("text", { nullable: true })
  expected?: string;

  @Column("boolean", { default: false })
  hasExpected!: boolean;

  @ManyToOne(() => Testcase, testcase => testcase.steps, { onDelete: "CASCADE" })
  testcase!: Relation<Testcase>;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
