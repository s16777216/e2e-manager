import { Entity, PrimaryGeneratedColumn, Column, Tree, TreeParent, TreeChildren, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Project } from "./Project.js";
import { Testcase } from "./Testcase.js";

@Entity()
@Tree("adjacency-list")
export class TestGroup {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @TreeParent()
  parent?: TestGroup | null;

  @TreeChildren()
  children!: TestGroup[];

  @ManyToOne(() => Project, project => project.groups, { onDelete: "CASCADE" })
  project!: any;

  @OneToMany(() => Testcase, testcase => testcase.group)
  testcases!: Testcase[];

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
