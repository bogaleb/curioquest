'use client';
import {BookOpen} from 'lucide-react';
export function ReadingInvitation({onOpen}:{onOpen:()=>void}){return <button className="reading-invitation" onClick={onOpen}><span aria-hidden="true">🦊 📚</span><span><small>NOVA’S READING ADVENTURE</small><strong>Little sounds. Big discoveries.</strong><span>Meet a letter, join the train, and build your first words.</span></span><BookOpen size={28}/></button>;}
