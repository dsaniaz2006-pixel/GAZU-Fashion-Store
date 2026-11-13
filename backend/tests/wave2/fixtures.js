// TDD fixtures: intentionally include unavailable/archived records to prevent hallucinated availability.
export const products=[
 {_id:'507f1f77bcf86cd799439001',name:'Minimal Cotton Tee',category:'Men',type:'T-Shirts',color:'White',description:'Minimal everyday cotton tee',styleTags:['minimal'],pricePaise:129900,quantity:8,inStock:true,active:true,publicationStatus:'published',img:'/products/demo-tee.jpg'},
 {_id:'507f1f77bcf86cd799439002',name:'Heritage Chino Trousers',category:'Men',type:'Trousers',color:'Beige',description:'Classic work trousers',styleTags:['heritage'],pricePaise:259900,quantity:4,inStock:true,active:true,publicationStatus:'published'},
 {_id:'507f1f77bcf86cd799439003',name:'Classic Leather Loafers',category:'Men',type:'Footwear',color:'Brown',description:'Formal shoes',styleTags:['heritage'],pricePaise:329900,quantity:2,inStock:true,active:true,publicationStatus:'published'},
 {_id:'507f1f77bcf86cd799439004',name:'Tailored Blazer',category:'Men',type:'Winterwear',color:'Navy',description:'Smart tailored jacket',styleTags:['heritage'],pricePaise:429900,quantity:3,inStock:true,active:true,publicationStatus:'published'},
 {_id:'507f1f77bcf86cd799439005',name:'Leather Belt',category:'Accessories',type:'Accessories',color:'Black',description:'Classic leather belt',styleTags:['heritage'],pricePaise:79900,quantity:4,inStock:true,active:true,publicationStatus:'published'},
 {_id:'507f1f77bcf86cd799439006',name:'Archived Dress',category:'Women',type:'Dresses',color:'Pink',description:'Never recommend',styleTags:[],pricePaise:99900,quantity:10,inStock:true,active:false,publicationStatus:'published'},
 {_id:'507f1f77bcf86cd799439007',name:'Out Of Stock Sneakers',category:'Men',type:'Footwear',color:'White',description:'Not in stock',styleTags:['street'],pricePaise:99900,quantity:0,inStock:false,active:true,publicationStatus:'published'},
 {_id:'507f1f77bcf86cd799439008',name:'Unpublished Jacket',category:'Men',type:'Winterwear',color:'Black',description:'Draft',styleTags:[],pricePaise:49900,quantity:9,inStock:true,active:true,publicationStatus:'draft'},
];
