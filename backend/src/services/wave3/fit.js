// Agent 1: Measurements are used only when a staff-verified BODY measurement table exists.
// Never silently convert garment measurements into body measurements or estimate size from labels.
export const MEASUREMENTS = Object.freeze(['chest','waist','hip']);
const range = (row,key)=>[Number(row[`${key}MinCm`]),Number(row[`${key}MaxCm`])];
export function verifiedChart(product){
 const chart=product?.fitData;
 if(!chart || chart.verified!==true || chart.measurementType!=='body' || chart.unit!=='cm' || !String(chart.source||'').trim() || !Array.isArray(chart.rows) || !chart.rows.length)return null;
 const rows=chart.rows.filter(row=>String(row.size||'').length>0 && MEASUREMENTS.some(k=>{const [a,b]=range(row,k);return Number.isFinite(a)&&Number.isFinite(b)&&a>0&&b>=a;}));
 return rows.length?{source:String(chart.source).slice(0,160),verifiedAt:chart.measuredAt||null,unit:'cm',measurementType:'body',rows}:null;
}
export function recommendFit(product,input={}){
 const chart=verifiedChart(product);
 const fallback={recommendedSize:null,confidence:'unavailable',explanation:'No staff-verified body measurement chart is available. Please use the published size guide or contact support; GAZU cannot predict fit from a size label alone.',sizeGuide:String(product?.sizeGuide||'').slice(0,1200),chart:chart?{source:chart.source,unit:chart.unit,rows:chart.rows}:null};
 if(!chart)return fallback;
 if(product.inStock===false || (Number.isFinite(product.quantity)&&product.quantity<=0))return {...fallback,explanation:'This product is currently unavailable; no purchasable size can be recommended.'};
 const measured=MEASUREMENTS.filter(k=>Number.isFinite(input[`${k}Cm`]) && input[`${k}Cm`]>0);
 if(!measured.length)return {...fallback,explanation:'A verified body-size chart exists, but enter an optional body measurement to compare its ranges. This does not guarantee fit.'};
 const variants=Array.isArray(product.variants)?product.variants:[];
 const available=variants.length?new Set(variants.filter(v=>v.quantity>0).map(v=>String(v.size).toLowerCase())):null;
 const options=chart.rows.filter(r=>(!available||available.has(String(r.size).toLowerCase())));
 const matches=options.map(row=>({row,matched:measured.filter(k=>{const[a,b]=range(row,k);return Number.isFinite(a)&&Number.isFinite(b)&&a>0&&b>=a&&input[`${k}Cm`]>=a&&input[`${k}Cm`]<=b;}).length,known:measured.filter(k=>{const[a,b]=range(row,k);return Number.isFinite(a)&&Number.isFinite(b)&&a>0&&b>=a;}).length})).filter(x=>x.known===measured.length&&x.matched===x.known);
 if(!matches.length)return {...fallback,explanation:'Your measurements do not fit an available, fully documented size range. Compare the size guide or ask support rather than guessing.'};
 if(matches.length>1)return {...fallback,confidence:'low',possibleSizes:matches.map(x=>x.row.size),explanation:'Your measurements overlap more than one available size. Review your fit preference and the size guide; no single size can be verified.'};
 const fitPref=['slim','regular','oversized'].includes(input.fitPreference)?input.fitPreference:'regular';
 return {recommendedSize:matches[0].row.size,confidence:measured.length>=2?'moderate':'low',explanation:`Your supplied body measurements fall within the verified ${matches[0].row.size} range (${chart.source}). Preference: ${fitPref}. Fabric, cut, and personal comfort may change real-world fit; this is not a guarantee.`,matchedMeasurements:measured,fitPreference:fitPref,chart:{source:chart.source,unit:'cm',rows:chart.rows},sizeGuide:String(product?.sizeGuide||'').slice(0,1200)};
}
export function compareFits(a,b,input={}) {return {first:{product:a?.name||'',...recommendFit(a,input)},second:{product:b?.name||'',...recommendFit(b,input)},notice:'Product cuts and charts differ. A matching body range is not a guarantee of fit.'};}
