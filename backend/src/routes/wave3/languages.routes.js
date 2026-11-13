import { Router } from "express";
import { languageLabel, voiceLocale } from "../../services/wave3/languages.js";
import { publicRate } from "./shared.js";

const router = Router();

// AGENT 3: metadata for extending the existing Wave 2 chat interface (not another assistant).
router.get('/languages',publicRate,(_req,res)=>res.json({items:[{code:'en',label:languageLabel('en'),voiceLocale:voiceLocale('en')},{code:'hi',label:languageLabel('hi'),voiceLocale:voiceLocale('hi')},{code:'pa',label:languageLabel('pa'),voiceLocale:voiceLocale('pa')}],note:'Voice recognition and speech synthesis depend on browser and installed speech voices.'}));

export default router;
