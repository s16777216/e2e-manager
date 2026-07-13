import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { TestGroup } from "./TestGroup.js";

@Entity()
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("text", { nullable: true })
  description?: string;

  @Column("text", { nullable: true })
  systemPrompt?: string;

  @OneToMany(() => TestGroup, group => group.project)
  groups!: TestGroup[];

  @Column("jsonb", { nullable: true })
  initCookies?: any;

  @Column("jsonb", { nullable: true })
  initLocalStorage?: any;

  @Column("jsonb", { nullable: true })
  variables?: any;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
