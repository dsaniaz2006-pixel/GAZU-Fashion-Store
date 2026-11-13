import React from 'react';
import {test,expect,vi,beforeEach} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {api} from '../api.js';
import {useFetch} from '../hooks/useFetch.js';
import {useAuth} from '../context/AuthContext.jsx';
import StyleFinder from '../pages/StyleFinder.jsx';
import Lookbook from '../pages/Lookbook.jsx';
import ShoppingAssistant from '../pages/wave2/ShoppingAssistant.jsx';
import VisualSearch from '../pages/wave2/VisualSearch.jsx';
import Discovery from '../pages/wave2/Discovery.jsx';
vi.mock('../api.js',async(load)=>({...await load(),api:vi.fn()}));
vi.mock('../hooks/useFetch.js',()=>({useFetch:vi.fn()}));
vi.mock('../context/AuthContext.jsx',()=>({useAuth:vi.fn()}));
vi.mock('../components/editorial/GazuEditorialArrival.jsx',()=>({default:({title})=><h1>{title}</h1>}));
vi.mock('../components/editorial/GazuEditNav.jsx',()=>({default:()=> <nav aria-label="Editorial collections navigation"/>}));
vi.mock('../components/dress-like/DressLikeSection.jsx',()=>({default:()=>null}));
const product={_id:'507f1f77bcf86cd799439001',name:'Minimal Cotton Tee',img:'photo-1521572163474-6864f9cf17ab',category:'Men',type:'T-Shirts',pricePaise:129900,quantity:2,inStock:true,active:true,styleTags:[]};
const mount=ui=>render(<MemoryRouter>{ui}</MemoryRouter>);
beforeEach(()=>{vi.mocked(useAuth).mockReturnValue({user:{id:'u1',name:'Customer'}});vi.mocked(useFetch).mockReturnValue({data:{items:[product]},loading:false,error:'',reload:vi.fn()});vi.mocked(api).mockReset();});
test('agent1 frontend integration: customer can request style edit without changing classic UI',async()=>{
 vi.mocked(api).mockResolvedValue({items:[product],summary:'Minimal items.',mode:'catalogue-curated'});
 mount(<StyleFinder/>);expect(screen.getByRole('heading',{name:'FIND YOUR STYLE'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'ASK GAZU STYLIST'}));
 await waitFor(()=>expect(screen.getByText(/Minimal items/)).toBeInTheDocument());expect(api).toHaveBeenCalledWith('/wave2/stylist',expect.objectContaining({method:'POST'}));
});
test('agent2 frontend integration: outfit builder discloses missing slots and real total',async()=>{
 vi.mocked(api).mockResolvedValue({items:[{slot:'top',product}],totalPricePaise:129900,complete:false,missingSlots:['bottom','footwear']});
 mount(<Lookbook/>);fireEvent.click(screen.getByRole('button',{name:'BUILD MY OUTFIT'}));
 await waitFor(()=>expect(screen.getByText(/Partial look/)).toBeInTheDocument());expect(screen.getByText(/Missing: bottom, footwear/)).toBeInTheDocument();
});
test('agent3 frontend integration: messages use authenticated conversation API',async()=>{
 vi.mocked(api).mockImplementation(async path=>path==='/wave2/conversations'?{items:[]}:path==='/wave2/chat'?{conversationId:'abc',message:'Try our cotton tee.',products:[product]}:{});
 mount(<ShoppingAssistant/>);fireEvent.change(screen.getByLabelText('Your style question'),{target:{value:'Show a cotton tee'}});fireEvent.click(screen.getByRole('button',{name:/SEND/}));
 await waitFor(()=>expect(screen.getByText('Try our cotton tee.')).toBeInTheDocument());expect(api).toHaveBeenCalledWith('/wave2/chat',expect.objectContaining({method:'POST'}));
});
test('agent4 frontend integration: upload is sent as multipart and results are not invented',async()=>{
 const stub=vi.spyOn(globalThis,'fetch').mockResolvedValue({ok:true,json:async()=>({description:{color:'black',garment:'tee',style:'minimal'},items:[product]})});
 try{mount(<VisualSearch/>);fireEvent.change(screen.getByLabelText(/Garment photograph/),{target:{files:[new File(['some bytes'],'tee.jpg',{type:'image/jpeg'})]}});
 fireEvent.click(screen.getByRole('button',{name:'FIND SIMILAR PIECES'}));
 await waitFor(()=>expect(screen.getByText(/Detected: black/)).toBeInTheDocument());
 expect(stub).toHaveBeenCalledWith(expect.stringMatching(/visual-search/),expect.objectContaining({method:'POST',body:expect.any(FormData)}));
 }finally{stub.mockRestore();}
});
test('agent5 frontend integration: discovery uses authenticated personalized catalogue response',()=>{
 vi.mocked(useFetch).mockReturnValue({data:{items:[{...product,reason:'Matches your style'}],personalized:false},loading:false,error:'',reload:vi.fn()});
 mount(<Discovery/>);expect(screen.getByRole('heading',{name:'DISCOVER YOUR EDIT'})).toBeInTheDocument();expect(screen.getByText('Matches your style')).toBeInTheDocument();
});
