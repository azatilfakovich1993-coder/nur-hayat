import{u as m,a as g,r as s,j as e}from"./index-BgTO562O.js";function x(){const n=m(),{user:o,loading:l}=g(),[t,r]=s.useState(0),[c,p]=s.useState(!1);return s.useEffect(()=>{const i=setTimeout(()=>r(1),400),f=setTimeout(()=>r(2),1200),u=setTimeout(()=>r(3),2800),d=setTimeout(()=>p(!0),3600);return()=>[i,f,u,d].forEach(clearTimeout)},[]),s.useEffect(()=>{!c||l||n(o?"/home":"/auth",{replace:!0})},[c,l,o,n]),s.useEffect(()=>{const i=setTimeout(()=>n("/auth",{replace:!0}),5e3);return()=>clearTimeout(i)},[n]),e.jsxs("div",{style:a.page,children:[e.jsx("div",{style:{...a.orb,width:320,height:320,top:-60,left:-80,animationDelay:"0s"}}),e.jsx("div",{style:{...a.orb,width:200,height:200,bottom:80,right:-40,animationDelay:"3s"}}),e.jsxs("div",{style:{...a.center,opacity:t===3?0:1,transition:"opacity 0.8s ease"},children:[e.jsx("div",{style:{...a.arabic,opacity:t>=1?1:0,transform:t>=1?"translateY(0) scale(1)":"translateY(20px) scale(0.95)",transition:"opacity 0.9s ease, transform 0.9s ease",animation:t>=1?"goldenPulse 3s ease-in-out infinite":"none"},children:"نور حياة"}),e.jsx("div",{style:{...a.latin,opacity:t>=2?1:0,transform:t>=2?"translateY(0)":"translateY(12px)",transition:"opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s"},children:"Нур Хаят"}),e.jsx("div",{style:{...a.subtitle,opacity:t>=2?1:0,transform:t>=2?"translateY(0)":"translateY(8px)",transition:"opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s"},children:"Светлая жизнь"}),e.jsx("div",{style:{...a.line,opacity:t>=2?.4:0,transition:"opacity 0.7s ease 0.5s"}})]}),e.jsx("style",{children:`
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
