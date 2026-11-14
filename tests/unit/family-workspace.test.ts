import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoLedger } from '../../src/data/demo-ledger.ts';
import { deriveSettlement } from '../../src/domain/settlement.ts';

class Store { data = new Map<string,string>(); getItem(k:string){ return this.data.get(k) ?? null; } setItem(k:string,v:string){this.data.set(k,v);} }
const meta=(key:string)=>({idempotencyKey:key});
test('family names and archived children preserve stable expense identity',async()=>{
 const db=new DemoLedger(new Store());
 const child=await db.createChild('Mia',meta('child'));
 await db.renameChild(child.id,'Mia Rose',meta('rename-child'));
 await db.renameParent('alex','Sam',meta('parent-a'));
 await db.renameParent('jordan','Sam',meta('parent-b'));
 await db.archiveChild(child.id,meta('archive'));
 const ctx=await db.getContext();
 assert.equal(ctx.members[0].userId,'alex');assert.equal(ctx.members[0].displayName,'Sam');
 assert.equal(ctx.children.find(c=>c.id===child.id)?.archived,true);
 assert.equal((await db.getExpense('e1')).expense.childId,'child-1');
});
test('categories support duplicate validation and corrections preserve financial state and audit',async()=>{
 const db=new DemoLedger(new Store());
 const cat=await db.createCategory('  Music  lessons ',meta('category'));
 await assert.rejects(db.createCategory('music lessons',meta('dup')),/already exists/i);
 const before=await db.getExpense('e1');
 const after=await db.changeCategory('e1',cat.id,{idempotencyKey:'change',expectedRevision:before.expense.lockVersion});
 for(const key of ['amountCents','reviewerOwedCents','reviewerShareBps','status','receiptId'] as const)assert.equal(after.expense[key],before.expense[key]);
 assert.deepEqual(after.reimbursements,before.reimbursements);
 assert.equal(after.audit.at(-1)?.action,'CATEGORY_CHANGED');
 assert.match(after.audit.at(-1)?.note ?? '',/School.*Music lessons/i);
});
test('statistics count approved purchases by payer and exclude disputes and reimbursements from purchase total',async()=>{
 const db=new DemoLedger(new Store());let report=await db.childStatistics('child-1');
 assert.equal(report.purchaseCents,20556);assert.equal(report.agreedCents,9078);
 assert.equal(report.confirmedCents,2000);assert.equal(report.remainingCents,7078);
 assert.equal(report.byParent.find(p=>p.actorId==='alex')?.purchaseCents,12001);
 assert.equal(report.byParent.find(p=>p.actorId==='jordan')?.purchaseCents,8555);
 assert.equal(report.records.length,2);
});
test('future plan remains separate from debts and duplicate conversion is rejected',async()=>{
 const db=new DemoLedger(new Store());const old=await db.childStatistics('child-1');
 const plan=await db.createPlan({title:'College',description:'Future tuition',childId:'child-1',category:'SCHOOL',targetCents:100000,reviewerShareBps:5000,targetDate:'',notes:''},meta('plan'));
 assert.equal((await db.childStatistics('child-1')).remainingCents,old.remainingCents);
 assert.equal(plan.status,'PLANNED');
 const created=await db.convertPlan(plan.id,meta('convert'));
 assert.equal(created.expense.status,'DRAFT');assert.equal(created.expense.amountCents,100000);
 await assert.rejects(db.convertPlan(plan.id,meta('convert-again')),/already|converted/i);
});
