import { useId } from "react";
import type { DiscoveryDomain } from "@/lib/discover/types";

/** Small authored illustrations, with shared materials but a distinct silhouette per domain. */
export function DiscoveryArt({ domain, hero = false }: { domain: DiscoveryDomain; hero?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 400 270" className={`discovery-art${hero ? " discovery-art-hero" : ""}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-paper`} x2="0" y2="1"><stop stopColor="var(--surface)"/><stop offset="1" stopColor="var(--sun-200)"/></linearGradient>
        <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="var(--kid-sky-100)"/><stop offset="1" stopColor="var(--kid-leaf-100)"/></linearGradient>
      </defs>
      <circle cx="205" cy="131" r="111" fill={`url(#${id}-sky)`} opacity=".75"/>
      <circle cx="305" cy="58" r="23" fill="var(--sun-200)"/>
      <path d="M46 213Q130 157 207 192T365 202" fill="none" stroke="var(--kid-leaf-200)" strokeWidth="3" strokeDasharray="5 9"/>
      <ellipse cx="205" cy="230" rx="119" ry="12" fill="var(--kid-ink)" opacity=".08"/>
      {domain === "reading" && <g strokeLinejoin="round">
        <path d="M66 192L191 220 329 184 202 153Z" fill="var(--kid-grape-600)"/>
        <path d="M76 116Q133 94 194 131L194 210Q128 177 76 191Z" fill={`url(#${id}-paper)`} stroke="var(--sun-300)" strokeWidth="2"/>
        <path d="M194 131Q253 95 318 112L318 185Q252 172 194 210Z" fill="var(--surface)" stroke="var(--sun-300)" strokeWidth="2"/>
        <path d="M194 131V210M94 141Q136 128 174 150M94 157Q136 144 174 166M214 150Q256 127 297 137M214 166Q256 143 297 153" fill="none" stroke="var(--sand-400)" strokeWidth="3"/>
        <path d="M258 111V174L271 165 284 174V107" fill="var(--kid-coral-400)"/>
        <path d="M154 62L162 81 182 85 166 99 168 120 151 109 132 118 137 97 124 81 145 80Z" fill="var(--sun-400)"/>
        <path d="M225 50L228 62 240 65 228 69 225 80 221 69 210 65 221 62Z" fill="var(--kid-grape-300)"/>
      </g>}
      {domain === "math" && <g strokeLinejoin="round">
        <path d="M94 155L139 134 184 155 139 177Z" fill="var(--sun-200)"/><path d="M94 155V205L139 227V177Z" fill="var(--sun-400)"/><path d="M139 177L184 155V205L139 227Z" fill="var(--sun-500)"/>
        <path d="M182 140L227 119 272 140 227 162Z" fill="var(--kid-sky-100)"/><path d="M182 140V203L227 225V162Z" fill="var(--kid-sky-300)"/><path d="M227 162L272 140V203L227 225Z" fill="var(--kid-sky-500)"/>
        <path d="M158 76L203 55 248 76 203 98Z" fill="var(--kid-coral-100)"/><path d="M158 76V124L203 147V98Z" fill="var(--kid-coral-300)"/><path d="M203 98L248 76V124L203 147Z" fill="var(--kid-coral-500)"/>
        <g fill="var(--surface)"><circle cx="180" cy="105" r="7"/><circle cx="207" cy="181" r="6"/><circle cx="207" cy="202" r="6"/><circle cx="113" cy="178" r="5"/><circle cx="124" cy="188" r="5"/><circle cx="113" cy="198" r="5"/></g>
        <circle cx="295" cy="113" r="17" fill="var(--kid-grape-200)"/><path d="M287 113H303M295 105V121" stroke="var(--kid-grape-ink)" strokeWidth="3" strokeLinecap="round"/>
      </g>}
      {domain === "science" && <g>
        <path d="M162 164H251L238 226H175Z" fill="var(--kid-coral-400)"/><path d="M160 161H254V175H160Z" fill="var(--kid-coral-300)"/>
        <path d="M208 165V85" stroke="var(--kid-leaf-600)" strokeWidth="7" strokeLinecap="round"/>
        <path d="M207 129Q151 134 153 87Q197 84 207 129" fill="var(--kid-leaf-400)"/><path d="M209 113Q260 119 270 72Q227 69 209 113" fill="var(--kid-leaf-500)"/>
        <path d="M159 92L201 126M217 108L261 78" stroke="var(--kid-leaf-200)" strokeWidth="2"/>
        <circle cx="123" cy="149" r="35" fill="var(--surface)" fillOpacity=".65" stroke="var(--kid-sky-600)" strokeWidth="9"/><path d="M99 174L74 204" stroke="var(--kid-sky-ink)" strokeWidth="13" strokeLinecap="round"/>
        <path d="M300 118Q278 147 301 153Q325 148 300 118" fill="var(--kid-sky-400)"/>
        <circle cx="113" cy="59" r="18" fill="var(--sun-400)"/>
      </g>}
      {domain === "logic" && <g strokeLinejoin="round">
        <rect x="128" y="95" width="143" height="116" rx="28" fill="var(--kid-sky-300)" stroke="var(--kid-sky-600)" strokeWidth="3"/>
        <rect x="147" y="118" width="105" height="58" rx="20" fill="var(--kid-sky-ink)"/>
        <circle cx="176" cy="143" r="9" fill="var(--sun-200)"/><circle cx="223" cy="143" r="9" fill="var(--sun-200)"/>
        <path d="M185 158Q200 166 213 157M201 96V70" fill="none" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="201" cy="64" r="10" fill="var(--kid-coral-400)"/>
        <path d="M128 153L99 164M272 151L296 132M165 211V227M237 211V227" stroke="var(--kid-sky-600)" strokeWidth="13" strokeLinecap="round"/>
        <path d="M86 102H110L102 93M307 174V199H283L291 190" fill="none" stroke="var(--kid-grape-400)" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="184" cy="190" r="4" fill="var(--kid-coral-400)"/><circle cx="202" cy="190" r="4" fill="var(--sun-400)"/><circle cx="220" cy="190" r="4" fill="var(--kid-leaf-600)"/>
      </g>}
      {domain === "world" && <g strokeLinejoin="round">
        <path d="M75 110L150 88 237 111 319 85V204L237 226 150 204 75 224Z" fill="var(--surface)" stroke="var(--sand-400)" strokeWidth="2"/>
        <path d="M150 88V204L237 226V111Z" fill="var(--kid-leaf-100)"/><path d="M92 190Q143 128 188 167T300 121" fill="none" stroke="var(--kid-sky-300)" strokeWidth="17"/>
        <path d="M150 88V204M237 111V226" stroke="var(--sand-300)" strokeWidth="2"/>
        <path d="M151 109C113 60 123 42 151 42C180 42 190 63 151 109" fill="var(--kid-coral-400)"/><circle cx="151" cy="65" r="10" fill="var(--surface)"/>
        <path d="M190 200Q226 141 280 163" fill="none" stroke="var(--kid-ink-soft)" strokeWidth="3" strokeDasharray="5 6"/>
        <circle cx="290" cy="180" r="29" fill="var(--sun-200)" stroke="var(--sun-500)" strokeWidth="3"/><path d="M290 158L281 187 290 183 299 187Z" fill="var(--kid-coral-500)"/>
      </g>}
      {domain === "wellbeing" && <g>
        <path d="M203 203C179 182 107 139 130 106C155 72 192 100 203 116C217 91 254 77 275 107C299 143 226 188 203 203" fill="var(--kid-coral-300)"/>
        <path d="M109 191L151 213Q172 230 196 216L219 200Q230 188 215 183L172 193 139 167" fill="var(--sun-200)" stroke="var(--sun-500)" strokeWidth="2"/>
        <path d="M293 181L256 207Q241 219 218 208" fill="none" stroke="var(--kid-grape-400)" strokeWidth="24" strokeLinecap="round"/>
        <circle cx="177" cy="133" r="4" fill="var(--kid-coral-ink)"/><circle cx="229" cy="133" r="4" fill="var(--kid-coral-ink)"/><path d="M188 149Q202 163 217 149" fill="none" stroke="var(--kid-coral-ink)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M110 74L115 89 130 94 115 99 110 114 105 99 90 94 105 89Z" fill="var(--sun-400)"/>
      </g>}
      <g fill="var(--sun-400)"><circle cx="71" cy="127" r="4"/><circle cx="330" cy="158" r="4"/><path d="M322 74L325 82 333 85 325 88 322 96 319 88 311 85 319 82Z"/></g>
    </svg>
  );
}

export function DiscoveryArrow() {
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12H20M14 6L20 12 14 18"/></svg>;
}
