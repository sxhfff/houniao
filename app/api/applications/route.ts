import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { applications } from "../../../db/schema";
export async function GET(){const rows=await getDb().select().from(applications).orderBy(desc(applications.id));return Response.json({applications:rows})}
export async function POST(request:Request){const body=await request.json() as {company?:string;role?:string;city?:string;resumeId?:number};if(!body.company?.trim()||!body.role?.trim())return Response.json({error:"公司和岗位不能为空"},{status:400});const[application]=await getDb().insert(applications).values({company:body.company.trim(),role:body.role.trim(),city:body.city?.trim()??"",resumeId:body.resumeId,appliedAt:new Date().toISOString()}).returning();return Response.json({application},{status:201})}
