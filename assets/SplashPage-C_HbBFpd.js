import{u as h,a as d,r,j as t}from"./index-BMOClQIL.js";function x(){const n=h(),{user:i,loading:p}=d(),[e,o]=r.useState(0),[u,m]=r.useState(!1);return r.useEffect(()=>{const s=setTimeout(()=>o(1),400),l=setTimeout(()=>o(2),1200),c=setTimeout(()=>m(!0),2800);return()=>[s,l,c].forEach(clearTimeout)},[]),r.useEffect(()=>{if(!u||p)return;o(3);const s=setTimeout(()=>n(i?"/home":"/auth",{replace:!0}),800);return()=>clearTimeout(s)},[u,p,i,n]),r.useEffect(()=>{const s=setTimeout(()=>{var c;let l=!1;try{const f=localStorage.getItem("nur-hayat-auth");l=!!(f&&((c=JSON.parse(f))!=null&&c.user))}catch{}o(3),n(l||i?"/home":"/auth",{replace:!0})},5e3);return()=>clearTimeout(s)},[i,n]),t.jsxs("div",{style:a.page,children:[t.jsx("div",{style:{...a.orb,width:320,height:320,top:-60,left:-80,animationDelay:"0s"}}),t.jsx("div",{style:{...a.orb,width:200,height:200,bottom:80,right:-40,animationDelay:"3s"}}),t.jsxs("div",{style:{...a.center,opacity:e===3?0:1,transition:"opacity 0.8s ease"},children:[t.jsx("div",{style:{...a.arabic,opacity:e>=1?1:0,transform:e>=1?"translateY(0) scale(1)":"translateY(20px) scale(0.95)",transition:"opacity 0.9s ease, transform 0.9s ease",animation:e>=1?"goldenPulse 3s ease-in-out infinite":"none"},children:"نور حياة"}),t.jsx("div",{style:{...a.latin,opacity:e>=2?1:0,transform:e>=2?"translateY(0)":"translateY(12px)",transition:"opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s"},children:"Нур Хаят"}),t.jsx("div",{style:{...a.subtitle,opacity:e>=2?1:0,transform:e>=2?"translateY(0)":"translateY(8px)",transition:"opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s"},children:"Светлая жизнь"}),t.jsx("div",{style:{...a.line,opacity:e>=2?.4:0,transition:"opacity 0.7s ease 0.5s"}})]}),t.jsx("style",{children:`
        @keyframes goldenPulse {
          0%, 100% {
            text-shadow:
              0 0 20px rgba(201,168,76,0.7),
              0 0 60px rgba(201,168,76,0.4),
              0 0 100px rgba(201,168,76,0.2);
          }
          50% {
            text-shadow:
              0 0 40px rgba(201,168,76,1),
              0 0 90px rgba(201,168,76,0.6),
              0 0 150px rgba(201,168,76,0.3);
          }
        }
        @keyframes orbFloat {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(10px,-15px); }
        }
      `})]})}const a={page:{height:"100%",background:"#070710",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"},orb:{position:"absolute",borderRadius:"50%",background:"radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)",filter:"blur(40px)",pointerEvents:"none",animation:"orbFloat 8s ease-in-out infinite"},center:{display:"flex",flexDirection:"column",alignItems:"center",gap:12,zIndex:1},arabic:{fontFamily:"'Scheherazade New', 'Amiri', serif",fontSize:64,fontWeight:700,color:"#C9A84C",direction:"rtl",lineHeight:1.2},latin:{fontFamily:"'Inter', sans-serif",fontSize:22,fontWeight:300,color:"#F0D080",letterSpacing:"0.18em",textTransform:"uppercase"},subtitle:{fontFamily:"'Inter', sans-serif",fontSize:14,fontWeight:300,color:"rgba(245,240,232,0.45)",letterSpacing:"0.25em",textTransform:"uppercase"},line:{marginTop:20,width:60,height:1,background:"linear-gradient(90deg, transparent, #C9A84C, transparent)"}};export{x as default};
