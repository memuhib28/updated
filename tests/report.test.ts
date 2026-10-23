import {describe,it,expect} from 'vitest';
import {reportData} from '../src/report-data';
import {type Day,type Attack,csv,validateDay} from '../src/core';
const day:Day={id:'d',date:'2026-10-10',headache:'no',sleep:null,quality:'',meals:'unknown',caffeine:null,exposures:'',notes:''};
const attack:Attack={id:'a',start:'2026-10-11T10:00:00Z',end:'2026-10-11T11:00:00Z',pain:0,location:'',description:'',symptoms:[],medication:'',dose:'',taken:null,notes:''};
describe('Pink report integrity',()=>{
 it('keeps missing days out of headache-free counts and preserves zero pain',()=>{const r=reportData({days:[day],attacks:[attack]},'2026-10-10','2026-10-12','UTC');expect(r.free).toBe(1);expect(r.headache).toBe(1);expect(r.missing).toBe(1);expect(r.recorded).toBe(2);expect(r.bins).toEqual([1,0,0,0]);});
 it('counts multiple attacks and medicines only once per day at the highest rating',()=>{const r=reportData({days:[],attacks:[{...attack,pain:4,medication:'A'},{...attack,id:'b',pain:8,medication:'B'}]},'2026-10-11','2026-10-11','UTC');expect(r.rated).toBe(1);expect(r.bins).toEqual([0,0,0,1]);expect(r.medicationDays).toBe(1);});
 it('validates pressure observations and includes them in exports',()=>{validateDay({...day,pressureHpa:1012});expect(()=>validateDay({...day,pressureHpa:200})).toThrow();expect(csv({days:[{...day,pressureHpa:1012}],attacks:[]})).toContain('1012');});
});
