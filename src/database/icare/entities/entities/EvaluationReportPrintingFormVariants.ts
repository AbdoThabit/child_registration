import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { EvaluationReport } from "./EvaluationReport";
import { Exclude, Expose, Transform } from "class-transformer";

@Index("PK_Evaluation_Report_Printing_Template", ["reportPrintingTemplateId"], {
  unique: true,
})
@Entity("Evaluation_Report_Printing_Form_Variants", { schema: "dbo" })
export class EvaluationReportPrintingFormVariants {
  @PrimaryGeneratedColumn({ type: "int", name: "report_printing_template_id" })
  reportPrintingTemplateId: number;

  @Column("int", { name: "center_id", nullable: true })
  centerId: number | null;

  @Exclude()
  @Column("nvarchar", { name: "evaluation_report_variants", nullable: true })
  _evaluationReportVariants: string | null;

  @Exclude()
  @Column("bit", { name: "is_deleted", nullable: true, default: () => "(0)" })
  isDeleted: boolean | null;

  @ManyToOne(
    () => EvaluationReport,
    (evaluationReport) => evaluationReport.evaluationReportPrintingFormVariants,
    { onDelete: "CASCADE" }
  )
  @JoinColumn([
    {
      name: "evaluation_report_id",
      referencedColumnName: "evaluationReportId",
    },
  ])
  evaluationReport: EvaluationReport;


  @Expose()
  @Transform(({ obj }) => {
    try {
      if (obj._evaluationReportVariants) {
        return JSON.parse(obj._evaluationReportVariants);
      }
    } catch (e) {}
    return null; 
  })
  evaluationReportVariants: object | null;
}
