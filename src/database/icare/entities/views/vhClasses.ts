

import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  name: 'vwClasses',
  schema: 'dbo'
})
export class vwClass {
@ViewColumn({ name: 'class_id' })
  classId: number;

  @ViewColumn({ name: 'center_id' })
  centerId: number;

  @ViewColumn({ name: 'class_theme' })
  classTheme: string | null;

  @ViewColumn({ name: 'class_logo' })
  classLogo: string | null;

  @ViewColumn({ name: 'class_section' })
  classSection: string | null;

  @ViewColumn({ name: 'class_ipcam' })
  classIpcam: string | null;

  @ViewColumn({ name: 'class_name' })
  className: string;

  @ViewColumn({ name: 'class_description' })
  classDescription: string | null;

  @ViewColumn({ name: 'class_name1' })
  className1: string | null;

  @ViewColumn({ name: 'class_description1' })
  classDescription1: string | null;

  @ViewColumn({ name: 'class_name2' })
  className2: string | null;

  @ViewColumn({ name: 'class_description2' })
  classDescription2: string | null;

  @ViewColumn({ name: 'SYID' })
  syid: number | null;

  @ViewColumn({ name: 'class_category' })
  classCategory: string | null;

  @ViewColumn({ name: 'class_capacity' })
  classCapacity: number;

  @ViewColumn({ name: 'deleted' })
  deleted: boolean | number;   // change to boolean if the column is actually BIT

  @ViewColumn({ name: 'child_count' })
  childCount: number;
}