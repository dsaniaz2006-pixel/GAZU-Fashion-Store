import React from 'react';
import {test,expect,vi,beforeEach} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {api} from '../api.js';
import {useAuth} from '../context/AuthContext.jsx';
import {useFetch} from '../hooks/useFetch.js';
import FitAssistant from '../pages/wave3/FitAssistant.jsx';
import SupportAssistant from '../pages/wave3/SupportAssistant.jsx';
import ShoppingAssistant from '../pages/wave2/ShoppingAssistant.jsx';
import AdminAIStudio from '../pages/wave3/AdminAIStudio.jsx';
import InventoryForecast from '../pages/wave3/InventoryForecast.jsx';
vi.mock('../api.js',async loader=>({...await loader(),api:vi.fn()}));
vi.mock('../context/AuthContext.jsx',()=>({useAuth:vi.fn()}));
vi.mock('../hooks/useFetch.js',()=>({useFetch:vi.fn()}));
vi.mock('../components/editorial/GazuEditorialArrival.jsx',()=>({default:({title})=><h1>{title}</h1>}));
vi.mock('../components/editorial/GazuEditNav.jsx',()=>({default:()=><nav aria-label="Editorial collections navigation"/>}));
const id='507f1f77bcf86cd799439093';
const mount=ui=>render(<MemoryRouter>{ui}</MemoryRouter>);
beforeEach(()=>{
 vi.mocked(api).mockReset();vi.mocked(useAuth).mockReturnValue({user:{id:'u1',name:'Customer',role:'customer'}});
 vi.mocked(useFetch).mockImplementation(path=>({loading:false,error:'',reload:vi.fn(),data:path==='/admin/products'?[{_id:id,name:'Verified Tee'}]:path==='/wave3/admin/audit'?{productCount:1,findings:[],reviewSentiment:{positive:0,negative:0,neutral:0}}:path==='/wave3/admin/suggestions'?{items:[]}:path?.includes('/wave3/admin/forecast')?{horizonDays:7,items:[{productId:id,name:'Verified Tee',forecast:{forecastUnits:null},inventory:{stock:1,risk:'high',suggestion:'Review replenishment',sizeNotes:[]}}]}:{items:[]}}));
});
test('agent1 frontend integration: shows only verified fit result after API confirmation',async()=>{
 vi.mocked(api).mockImplementation(async path=>path==='/wave3/fit/products'?{items:[{id,name:'Verified Tee',hasVerifiedChart:true}]}:{product:{name:'Verified Tee'},recommendedSize:'M',confidence:'moderate',explanation:'Verified body chart, not guaranteed.'});
 mount(<FitAssistant/>);await screen.findByText(/Verified Tee/);fireEvent.change(screen.getByLabelText('Chest (cm)'),{target:{value:'98'}});fireEvent.click(screen.getByRole('button',{name:'CHECK VERIFIED FIT'}));await screen.findByText('Verified body chart, not guaranteed.');expect(api).toHaveBeenCalledWith('/wave3/fit/recommend',expect.objectContaining({method:'POST'}));
});
test('agent2 frontend integration: customer asks order-support API without exposing other orders',async()=>{
 vi.mocked(api).mockImplementation(async path=>path.endsWith('/orders')?{items:[]}:path.endsWith('/tickets')?{items:[]}:path==='/wave3/support/ask'?{category:'delivery',answer:'Order is preparing',disclaimer:'No promise made'}:{});
 mount(<SupportAssistant/>);fireEvent.change(screen.getByPlaceholderText(/Where is my order/i),{target:{value:'where is my parcel'}});fireEvent.click(screen.getByRole('button',{name:'ASK ABOUT MY ORDER'}));await screen.findByText('Order is preparing');expect(api).toHaveBeenCalledWith('/wave3/support/ask',expect.objectContaining({method:'POST'}));
});
test('agent3 frontend integration: Hindi uses existing authenticated Wave 2 chat endpoint',async()=>{
 vi.mocked(api).mockImplementation(async path=>path==='/wave2/conversations'?{items:[]}:path==='/wave2/chat'?{conversationId:id,message:'एक शर्ट उपलब्ध है',products:[]}:{});
 mount(<ShoppingAssistant/>);fireEvent.change(screen.getByLabelText('Response language'),{target:{value:'hi'}});fireEvent.change(screen.getByLabelText('Your style question'),{target:{value:'मुझे शर्ट चाहिए'}});fireEvent.click(screen.getByRole('button',{name:/SEND/}));await screen.findByText('एक शर्ट उपलब्ध है');expect(api).toHaveBeenCalledWith('/wave2/chat',expect.objectContaining({body:expect.objectContaining({language:'hi'})}));
});
test('agent4 frontend integration: approval and rejection are explicit buttons',()=>{vi.mocked(useAuth).mockReturnValue({user:{id:'staff',role:'admin'}});vi.mocked(useFetch).mockImplementation(path=>({loading:false,error:'',reload:vi.fn(),data:path==='/wave3/admin/suggestions'?{items:[{_id:id,status:'pending',product:{name:'Verified Tee'},suggestedFields:{description:'A classic garment'}}]}:path==='/admin/products'?[{_id:id,name:'Verified Tee'}]:{productCount:1,findings:[],reviewSentiment:{positive:0,negative:0,neutral:0}}}));mount(<AdminAIStudio/>);expect(screen.getByRole('button',{name:'APPROVE'})).toBeInTheDocument();expect(screen.getByRole('button',{name:'REJECT'})).toBeInTheDocument();});
test('agent5 frontend integration: insufficient forecast is labelled, not invented',()=>{mount(<InventoryForecast/>);expect(screen.getByText('INSUFFICIENT DATA')).toBeInTheDocument();expect(screen.getByText(/No action taken/i)).toBeInTheDocument();});
