import {z} from 'zod';
const optionalShort=z.string().trim().max(120).nullable().optional();
export const productDraftSchema=z.object({category:z.enum(['Men','Women','Kids','Accessories']).nullable().optional(),type:optionalShort,color:optionalShort,styleTags:z.array(z.string().trim().min(1).max(32)).max(8).default([]),patterns:z.array(z.string().trim().max(40)).max(6).default([]),occasions:z.array(z.string().trim().max(40)).max(6).default([]),description:z.string().trim().max(1000).optional().default(''),altText:z.string().trim().max(300).optional().default('')}).strip();
export function validateProductDraft(raw){
 const draft=productDraftSchema.parse(raw);
 draft.styleTags=draft.styleTags.filter(tag=>/^[\p{L}\p{N}][\p{L}\p{N} -]{0,31}$/u.test(tag)&& !/(ignore previous|reveal system|api key|bypass safety|system prompt)/i.test(tag));
 return draft;
}
