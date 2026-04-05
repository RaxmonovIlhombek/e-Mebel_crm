import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  useEffect(() => {
    const prevBg = document.body.style.background
    document.body.style.background = '#060a14'

    const reveals = document.querySelectorAll('.lp-reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('lp-visible'), i * 80)
          observer.unobserve(e.target)
        }
      })
    }, { threshold: 0.1 })
    reveals.forEach(el => observer.observe(el))

    setTimeout(() => {
      document.querySelectorAll('.lp-bar').forEach(b => {
        const h = b.getAttribute('data-h')
        b.style.transition = 'height .8s ease'
        b.style.height = h
      })
    }, 600)

    const onScroll = () => {
      const nav = document.getElementById('lp-nav')
      if (nav) nav.style.background = window.scrollY > 50
        ? 'rgba(6,10,20,0.97)' : 'rgba(6,10,20,0.85)'
    }
    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.body.style.background = prevBg
    }
  }, [])

  const go = () => navigate('/login')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        .lp-wrap *{margin:0;padding:0;box-sizing:border-box}
        .lp-wrap{
          --acc:#2563eb;
          --acc2:#1d4ed8;
          --acc3:#3b82f6;
          --acc-light:#60a5fa;
          --acc-glow:rgba(37,99,235,0.35);
          --acc-soft:rgba(37,99,235,0.12);
          --acc-border:rgba(59,130,246,0.3);
          --green:#10b981;
          --red:#f87171;
          --yellow:#fbbf24;
          --bg:#060a14;
          --bg2:#0b1120;
          --bg3:#111827;
          --bg4:#1a2235;
          --txt:#e8edf8;
          --txt2:#7b8db0;
          --txt3:#3d4e6b;
          --bdr:rgba(255,255,255,0.06);
          --bdr2:rgba(59,130,246,0.15);
          font-family:'Plus Jakarta Sans',sans-serif;
          background:var(--bg);color:var(--txt);
          overflow-x:hidden;line-height:1.6;
        }
        .lp-wrap a{text-decoration:none;cursor:pointer}

        /* NAV */
        #lp-nav{
          position:fixed;top:0;left:0;right:0;z-index:100;
          display:flex;align-items:center;justify-content:space-between;
          padding:14px 60px;
          background:rgba(6,10,20,0.85);
          backdrop-filter:blur(24px);
          border-bottom:1px solid var(--bdr);
          transition:background .3s;
        }
        .lp-logo{display:flex;align-items:center;gap:4px}
        .lp-nav-links{display:flex;align-items:center;gap:28px}
        .lp-nav-links a{color:var(--txt2);font-size:14px;font-weight:500;transition:color .2s}
        .lp-nav-links a:hover{color:var(--acc-light)}
        .lp-nav-cta{
          padding:8px 22px;border-radius:9px;
          background:var(--acc);color:#fff;
          font-size:13px;font-weight:700;
          transition:all .2s;
          box-shadow:0 4px 18px var(--acc-glow);
          border:none;cursor:pointer;letter-spacing:.2px;
        }
        .lp-nav-cta:hover{background:var(--acc2);transform:translateY(-1px);box-shadow:0 6px 24px var(--acc-glow)}

        /* HERO */
        .lp-hero{
          min-height:100vh;display:flex;align-items:center;
          padding:120px 60px 80px;position:relative;overflow:hidden;
        }
        .lp-glow1{
          position:absolute;top:-150px;right:-50px;width:700px;height:700px;border-radius:50%;
          background:radial-gradient(circle,rgba(37,99,235,0.14) 0%,transparent 65%);
          pointer-events:none;
        }
        .lp-glow2{
          position:absolute;bottom:-200px;left:-100px;width:500px;height:500px;border-radius:50%;
          background:radial-gradient(circle,rgba(96,165,250,0.07) 0%,transparent 65%);
          pointer-events:none;
        }
        .lp-glow3{
          position:absolute;top:40%;left:40%;width:300px;height:300px;border-radius:50%;
          background:radial-gradient(circle,rgba(37,99,235,0.06) 0%,transparent 65%);
          pointer-events:none;
        }
        .lp-grid-bg{
          position:absolute;inset:0;
          background-image:
            linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),
            linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px);
          background-size:56px 56px;
          mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent);
        }
        .lp-hero-content{max-width:620px;position:relative;z-index:1}
        .lp-badge{
          display:inline-flex;align-items:center;gap:8px;
          padding:5px 14px;border-radius:100px;
          background:var(--acc-soft);
          border:1px solid var(--acc-border);
          font-size:11px;font-weight:700;color:var(--acc-light);
          margin-bottom:26px;letter-spacing:.3px;text-transform:uppercase;
          animation:lpFadeUp .6s ease both;
        }
        .lp-badge-dot{
          width:6px;height:6px;border-radius:50%;
          background:var(--acc-light);animation:lpPulse 2s infinite;
        }
        h1.lp-h1{
          font-size:clamp(42px,5vw,72px);font-weight:900;line-height:1.04;
          letter-spacing:-2.5px;margin-bottom:22px;
          animation:lpFadeUp .6s .1s ease both;
        }
        .lp-h1 .lp-grad{
          background:linear-gradient(135deg,#60a5fa 0%,#2563eb 50%,#1e40af 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .lp-sub{
          font-size:16px;color:var(--txt2);line-height:1.75;
          margin-bottom:36px;max-width:490px;
          animation:lpFadeUp .6s .2s ease both;
        }
        .lp-actions{display:flex;gap:12px;flex-wrap:wrap;animation:lpFadeUp .6s .3s ease both}
        .lp-btn-primary{
          padding:13px 28px;border-radius:10px;background:var(--acc);color:#fff;
          font-size:14px;font-weight:700;border:none;cursor:pointer;
          transition:all .2s;box-shadow:0 8px 28px var(--acc-glow);
          display:inline-flex;align-items:center;gap:7px;
        }
        .lp-btn-primary:hover{background:var(--acc2);transform:translateY(-2px);box-shadow:0 12px 36px var(--acc-glow)}
        .lp-btn-secondary{
          padding:13px 28px;border-radius:10px;
          background:rgba(255,255,255,0.05);color:var(--txt);
          font-size:14px;font-weight:600;
          border:1px solid var(--bdr2);
          cursor:pointer;transition:all .2s;
        }
        .lp-btn-secondary:hover{background:var(--acc-soft);border-color:var(--acc-border);transform:translateY(-2px)}
        .lp-stats{
          display:flex;gap:36px;margin-top:50px;padding-top:36px;
          border-top:1px solid var(--bdr);
          animation:lpFadeUp .6s .4s ease both;
        }
        .lp-stat-num{font-size:28px;font-weight:900;color:var(--txt)}
        .lp-stat-num span{color:var(--acc-light)}
        .lp-stat-lbl{font-size:11px;color:var(--txt3);margin-top:2px;font-weight:500}

        /* MOCKUP */
        .lp-mockup-wrap{
          position:absolute;right:-10px;top:50%;transform:translateY(-50%);
          width:520px;z-index:1;
          animation:lpFadeLeft .8s .2s ease both;
        }
        .lp-mockup{
          background:var(--bg2);border-radius:18px;
          border:1px solid rgba(59,130,246,0.15);
          box-shadow:0 40px 90px rgba(0,0,0,0.7),0 0 60px rgba(37,99,235,0.08),0 0 0 1px rgba(255,255,255,0.03);
          overflow:hidden;
        }
        .lp-mbar{
          display:flex;align-items:center;gap:7px;padding:11px 16px;
          border-bottom:1px solid var(--bdr);
          background:rgba(37,99,235,0.04);
        }
        .lp-mdot{width:8px;height:8px;border-radius:50%}
        .lp-mcontent{padding:16px}
        .lp-mcards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
        .lp-mcard{
          background:var(--bg3);border-radius:10px;padding:11px;
          border:1px solid var(--bdr);
        }
        .lp-mcard-lbl{font-size:8px;color:var(--txt3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;font-weight:600}
        .lp-mcard-val{font-size:16px;font-weight:900;color:var(--txt)}
        .lp-chart-wrap{
          background:var(--bg3);border-radius:10px;padding:11px;
          border:1px solid var(--bdr);margin-bottom:10px;
        }
        .lp-chart-lbl{font-size:8px;color:var(--txt3);margin-bottom:9px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
        .lp-bars{display:flex;align-items:flex-end;gap:4px;height:48px}
        .lp-bar{flex:1;border-radius:3px 3px 0 0;background:rgba(37,99,235,0.25);height:0}
        .lp-bar.lp-active{background:linear-gradient(180deg,#60a5fa,#2563eb)}
        .lp-morders{background:var(--bg3);border-radius:10px;border:1px solid var(--bdr);overflow:hidden}
        .lp-mrow{
          display:flex;justify-content:space-between;align-items:center;
          padding:7px 11px;border-bottom:1px solid rgba(255,255,255,0.03);font-size:9px;
        }
        .lp-mrow:last-child{border-bottom:none}
        .lp-ob{padding:2px 6px;border-radius:100px;font-size:7px;font-weight:700}

        /* SECTIONS */
        .lp-section{padding:88px 60px;position:relative}
        .lp-sec-lbl{
          display:inline-block;font-size:10px;font-weight:700;
          letter-spacing:2.5px;text-transform:uppercase;
          color:var(--acc-light);margin-bottom:12px;
        }
        .lp-sec-title{
          font-size:clamp(30px,3.2vw,46px);font-weight:900;
          letter-spacing:-1.5px;margin-bottom:14px;line-height:1.08;
        }
        .lp-sec-sub{font-size:15px;color:var(--txt2);max-width:480px;line-height:1.75}

        /* Features */
        .lp-features{
          display:grid;grid-template-columns:repeat(3,1fr);
          gap:1px;margin-top:54px;background:var(--bdr);
          border-radius:18px;overflow:hidden;
          border:1px solid var(--bdr);
        }
        .lp-feat{
          background:var(--bg);padding:34px 26px;
          transition:background .25s;position:relative;overflow:hidden;
        }
        .lp-feat::before{
          content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,var(--acc),transparent);
          transform:scaleX(0);transition:transform .4s;
        }
        .lp-feat:hover{background:var(--bg2)}
        .lp-feat:hover::before{transform:scaleX(1)}
        .lp-feat-icon{
          width:46px;height:46px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;
          font-size:20px;margin-bottom:16px;
          background:var(--acc-soft);
          border:1px solid var(--acc-border);
        }
        .lp-feat-title{font-size:15px;font-weight:800;margin-bottom:8px;color:var(--txt)}
        .lp-feat-desc{font-size:12px;color:var(--txt2);line-height:1.75}

        /* Roles */
        .lp-roles-bg{background:var(--bg2)}
        .lp-roles{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:54px}
        .lp-role{
          background:var(--bg3);border-radius:16px;padding:26px 20px;
          border:1px solid var(--bdr);transition:all .25s;position:relative;overflow:hidden;
        }
        .lp-role::before{
          content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:var(--rc,var(--acc));
          transform:scaleX(0);transform-origin:left;transition:transform .3s;
        }
        .lp-role:hover{transform:translateY(-4px);border-color:var(--bdr2)}
        .lp-role:hover::before{transform:scaleX(1)}
        .lp-role-icon{font-size:32px;margin-bottom:12px;display:block}
        .lp-role-name{font-size:15px;font-weight:900;margin-bottom:10px;color:var(--txt)}
        .lp-role-list{list-style:none;display:flex;flex-direction:column;gap:6px}
        .lp-role-list li{font-size:11px;color:var(--txt2);display:flex;align-items:flex-start;gap:6px}
        .lp-role-list li::before{content:'✓';color:var(--green);font-weight:700;flex-shrink:0}

        /* Stats band */
        .lp-band{
          padding:60px 60px;
          background:linear-gradient(135deg,rgba(37,99,235,0.07),rgba(96,165,250,0.04));
          border-top:1px solid var(--bdr2);border-bottom:1px solid var(--bdr2);
        }
        .lp-band-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:36px;text-align:center}
        .lp-band-num{
          font-size:42px;font-weight:900;line-height:1;
          background:linear-gradient(135deg,#93c5fd,#2563eb);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .lp-band-lbl{font-size:12px;color:var(--txt2);margin-top:7px;font-weight:500}

        /* AI */
        .lp-ai{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
        .lp-chat{
          background:var(--bg2);border-radius:18px;
          border:1px solid var(--bdr2);padding:22px;
          box-shadow:0 24px 60px rgba(0,0,0,0.5),0 0 40px rgba(37,99,235,0.06);
        }
        .lp-cmsg{display:flex;gap:9px;margin-bottom:12px}
        .lp-cavatar{
          width:28px;height:28px;border-radius:50%;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;font-size:12px;
        }
        .lp-cavatar.ai{background:linear-gradient(135deg,#3b82f6,#1d4ed8)}
        .lp-cavatar.user{background:var(--bg3);border:1px solid var(--bdr)}
        .lp-cbubble{
          padding:9px 12px;border-radius:11px;font-size:11px;
          line-height:1.65;max-width:250px;
        }
        .lp-cbubble.ai{background:var(--bg3);border-radius:4px 11px 11px 11px;border:1px solid var(--bdr)}
        .lp-cbubble.user{
          background:var(--acc-soft);border:1px solid var(--acc-border);
          border-radius:11px 4px 11px 11px;margin-left:auto;
        }
        .lp-cmsg.user{flex-direction:row-reverse}
        .lp-typing{display:flex;gap:4px;padding:8px 10px;align-items:center}
        .lp-typing span{
          width:5px;height:5px;border-radius:50%;
          background:var(--acc-light);animation:lpBounce .9s infinite;
        }
        .lp-typing span:nth-child(2){animation-delay:.15s}
        .lp-typing span:nth-child(3){animation-delay:.3s}

        /* Pricing */
        .lp-pricing-bg{background:var(--bg2)}
        .lp-pricing{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:54px}
        .lp-pcard{
          background:var(--bg3);border-radius:20px;padding:34px 26px;
          border:1px solid var(--bdr);position:relative;transition:all .25s;
        }
        .lp-pcard:hover{transform:translateY(-3px);border-color:var(--bdr2)}
        .lp-pcard.lp-pfeat{
          background:linear-gradient(135deg,rgba(37,99,235,0.1),rgba(37,99,235,0.04));
          border-color:rgba(59,130,246,0.4);
          box-shadow:0 0 40px rgba(37,99,235,0.1);
        }
        .lp-pbadge{
          position:absolute;top:-11px;left:50%;transform:translateX(-50%);
          padding:3px 14px;border-radius:100px;
          background:var(--acc);color:#fff;
          font-size:9px;font-weight:700;white-space:nowrap;
          box-shadow:0 4px 14px var(--acc-glow);
        }
        .lp-pname{font-size:17px;font-weight:900;margin-bottom:5px;color:var(--txt)}
        .lp-pdesc{font-size:11px;color:var(--txt3);margin-bottom:20px;font-weight:500}
        .lp-pprice{font-size:34px;font-weight:900;line-height:1;margin-bottom:4px;color:var(--txt)}
        .lp-pprice span{font-size:13px;font-weight:500;color:var(--txt3)}
        .lp-pperiod{font-size:11px;color:var(--txt3);margin-bottom:24px;font-weight:500}
        .lp-pfeats{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:26px}
        .lp-pfeats li{font-size:12px;color:var(--txt2);display:flex;gap:8px;align-items:flex-start}
        .lp-pfeats li::before{content:'✓';color:var(--green);font-weight:700;flex-shrink:0}
        .lp-pbtn{
          display:block;text-align:center;padding:11px;border-radius:10px;
          font-size:13px;font-weight:700;transition:all .2s;cursor:pointer;border:none;
          font-family:inherit;
        }
        .lp-pbtn.outline{
          background:transparent;border:1.5px solid var(--bdr2);color:var(--txt2);
        }
        .lp-pbtn.outline:hover{border-color:var(--acc-light);color:var(--acc-light)}
        .lp-pbtn.solid{
          background:var(--acc);color:#fff;
          box-shadow:0 4px 20px var(--acc-glow);
        }
        .lp-pbtn.solid:hover{background:var(--acc2)}

        /* CTA */
        .lp-cta{
          padding:88px 60px;text-align:center;
          background:radial-gradient(ellipse 60% 60% at 50% 50%,rgba(37,99,235,0.07),transparent);
        }
        .lp-cta h2{
          font-size:clamp(34px,4vw,58px);font-weight:900;
          letter-spacing:-2px;margin-bottom:18px;
        }
        .lp-cta-sub{font-size:15px;color:var(--txt2);max-width:420px;margin:0 auto 36px;line-height:1.75}
        .lp-cta-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}

        /* FOOTER */
        .lp-footer{
          padding:40px 60px;border-top:1px solid var(--bdr);
          display:flex;justify-content:space-between;align-items:center;
        }
        .lp-footer-copy{font-size:11px;color:var(--txt3)}
        .lp-footer-links{display:flex;gap:22px}
        .lp-footer-links a{font-size:11px;color:var(--txt3);transition:color .2s;font-weight:500}
        .lp-footer-links a:hover{color:var(--acc-light)}

        /* Reveal */
        .lp-reveal{opacity:0;transform:translateY(26px);transition:all .65s ease}
        .lp-visible{opacity:1;transform:translateY(0)}

        /* Animations */
        @keyframes lpFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lpFadeLeft{from{opacity:0;transform:translate(32px,-50%)}to{opacity:1;transform:translate(0,-50%)}}
        @keyframes lpPulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes lpBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}

        /* Responsive */
        @media(max-width:1100px){
          .lp-mockup-wrap{display:none}
          .lp-features{grid-template-columns:1fr 1fr}
          .lp-roles{grid-template-columns:1fr 1fr}
          .lp-ai{grid-template-columns:1fr}
        }
        @media(max-width:768px){
          #lp-nav{padding:12px 20px}
          .lp-nav-links{display:none}
          .lp-hero,.lp-section,.lp-cta{padding:70px 20px}
          .lp-band{padding:40px 20px}
          .lp-band-grid{grid-template-columns:1fr 1fr;gap:20px}
          .lp-features{grid-template-columns:1fr}
          .lp-roles{grid-template-columns:1fr 1fr}
          .lp-pricing{grid-template-columns:1fr}
          .lp-footer{flex-direction:column;gap:16px;text-align:center;padding:32px 20px}
        }
        /* Testimonials */
        .lp-testimonials{
          display:grid;grid-template-columns:repeat(3,1fr);
          gap:20px;margin-top:54px;
        }
        .lp-tcard{
          background:var(--bg3);border-radius:18px;padding:26px;
          border:1px solid var(--bdr);transition:all .25s;
        }
        .lp-tcard:hover{border-color:var(--bdr2);transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.4)}
        .lp-tstars{display:flex;gap:3px;margin-bottom:14px}
        .lp-tstar{color:#fbbf24;font-size:13px}
        .lp-tquote{font-size:13px;color:var(--txt2);line-height:1.7;margin-bottom:18px;font-style:italic}
        .lp-tauthor{display:flex;align-items:center;gap:10px}
        .lp-tavatar{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
        .lp-tname{font-size:13px;font-weight:700;color:var(--txt)}
        .lp-trole{font-size:11px;color:var(--txt3);margin-top:2px}
        .lp-tverified{display:flex;align-items:center;gap:4px;font-size:10px;color:#34d399;font-weight:600;margin-top:4px}
        /* FAQ */
        .lp-faq{max-width:720px;margin:54px auto 0;display:flex;flex-direction:column;gap:10px}
        .lp-fitem{background:var(--bg3);border-radius:14px;border:1px solid var(--bdr);overflow:hidden;transition:border-color .2s}
        .lp-fitem.open{border-color:var(--bdr2)}
        .lp-fq{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;cursor:pointer;gap:16px;font-size:14px;font-weight:700;color:var(--txt);transition:background .2s}
        .lp-fq:hover{background:rgba(59,130,246,0.04)}
        .lp-farrow{font-size:18px;color:var(--acc-light);flex-shrink:0;transition:transform .3s;display:inline-block}
        .lp-fitem.open .lp-farrow{transform:rotate(45deg)}
        .lp-fa{max-height:0;overflow:hidden;transition:max-height .35s ease,padding .25s;padding:0 22px;font-size:13px;color:var(--txt2);line-height:1.75}
        .lp-fitem.open .lp-fa{max-height:200px;padding-bottom:18px}
        @media(max-width:768px){.lp-testimonials{grid-template-columns:1fr}}
      `}</style>

      <div className="lp-wrap">

        {/* NAV */}
        <nav id="lp-nav">
          <div className="lp-logo">
            <img src="/logo (2).png" alt="e-Mebel CRM"
              style={{height:40,width:'auto',objectFit:'contain'}}/>
          </div>
          <div className="lp-nav-links">
            <a href="#lp-features">Imkoniyatlar</a>
            <a href="#lp-roles">Rollar</a>
            <a href="#lp-ai">AI</a>
            <a href="#lp-pricing">Narxlar</a>
            <a href="#lp-faq">FAQ</a>
          </div>
          <button className="lp-nav-cta" onClick={go}>Kirish →</button>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-glow1"/><div className="lp-glow2"/><div className="lp-glow3"/>
          <div className="lp-grid-bg"/>
          <div className="lp-hero-content">
            <div className="lp-badge">
              <span className="lp-badge-dot"/>
              Mebel do'konlari uchun #1 CRM
            </div>
            <h1 className="lp-h1">
              Mebel biznesingizni{' '}
              <span className="lp-grad">aqlli</span>{' '}
              boshqaring
            </h1>
            <p className="lp-sub">
              Buyurtmalar, omborxona, moliya, mijozlar — barchasini bitta tizimda.
              AI yordamchi, Telegram bot va real-time hisobotlar bilan.
            </p>
            <div className="lp-actions">
              <button className="lp-btn-primary" onClick={go}>Bepul boshlash →</button>
              <a href="#lp-features" className="lp-btn-secondary">Imkoniyatlarni ko'rish</a>
            </div>
            <div className="lp-stats">
              <div>
                <div className="lp-stat-num">500<span>+</span></div>
                <div className="lp-stat-lbl">Faol foydalanuvchi</div>
              </div>
              <div>
                <div className="lp-stat-num">12k<span>+</span></div>
                <div className="lp-stat-lbl">Buyurtma boshqarilgan</div>
              </div>
              <div>
                <div className="lp-stat-num">99<span>%</span></div>
                <div className="lp-stat-lbl">Mijoz mamnuniyati</div>
              </div>
            </div>
          </div>

          {/* MOCKUP */}
          <div className="lp-mockup-wrap">
            <div className="lp-mockup">
              <div className="lp-mbar">
                <div className="lp-mdot" style={{background:'#ff5f57'}}/>
                <div className="lp-mdot" style={{background:'#febc2e'}}/>
                <div className="lp-mdot" style={{background:'#28c840'}}/>
                <img src="/logo (2).png" alt="e-Mebel"
                  style={{height:14,marginLeft:8,objectFit:'contain',opacity:.7}}/>
                <span style={{marginLeft:6,fontSize:9,color:'#3d4e6b',fontWeight:600}}>e-Mebel CRM</span>
              </div>
              <div className="lp-mcontent">
                <div className="lp-mcards">
                  <div className="lp-mcard">
                    <div className="lp-mcard-lbl">Bu oy tushum</div>
                    <div className="lp-mcard-val" style={{color:'#34d399'}}>48.2M so'm</div>
                    <div style={{fontSize:8,color:'#34d399',marginTop:3,fontWeight:600}}>↑ 18% o'sdi</div>
                  </div>
                  <div className="lp-mcard">
                    <div className="lp-mcard-lbl">Faol buyurtmalar</div>
                    <div className="lp-mcard-val" style={{color:'#60a5fa'}}>24 ta</div>
                    <div style={{fontSize:8,color:'#3d4e6b',marginTop:3}}>3 ta kechikkan</div>
                  </div>
                  <div className="lp-mcard">
                    <div className="lp-mcard-lbl">Jami mijozlar</div>
                    <div className="lp-mcard-val">186 ta</div>
                    <div style={{fontSize:8,color:'#34d399',marginTop:3,fontWeight:600}}>+12 bu oy</div>
                  </div>
                  <div className="lp-mcard">
                    <div className="lp-mcard-lbl">Umumiy qarz</div>
                    <div className="lp-mcard-val" style={{color:'#f87171'}}>2.4M so'm</div>
                    <div style={{fontSize:8,color:'#3d4e6b',marginTop:3}}>5 ta buyurtma</div>
                  </div>
                </div>
                <div className="lp-chart-wrap">
                  <div className="lp-chart-lbl">Oylik savdo dinamikasi</div>
                  <div className="lp-bars">
                    {[35,55,45,70,60,80,95].map((h, i) => (
                      <div key={i} className={`lp-bar${i===6?' lp-active':''}`} data-h={`${h}%`}/>
                    ))}
                  </div>
                </div>
                <div className="lp-morders">
                  <div className="lp-mrow" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                    <span style={{fontSize:8,color:'#3d4e6b',fontWeight:700,textTransform:'uppercase',letterSpacing:.5}}>OXIRGI BUYURTMALAR</span>
                  </div>
                  <div className="lp-mrow">
                    <span>#MB2401 · Karimov A.</span>
                    <span className="lp-ob" style={{background:'rgba(37,99,235,0.18)',color:'#60a5fa'}}>Yangi</span>
                    <span style={{color:'#34d399',fontWeight:700}}>4,800,000</span>
                  </div>
                  <div className="lp-mrow">
                    <span>#MB2400 · Toshev B.</span>
                    <span className="lp-ob" style={{background:'rgba(251,191,36,0.15)',color:'#fbbf24'}}>Ishlab chiq.</span>
                    <span style={{color:'#34d399',fontWeight:700}}>12,500,000</span>
                  </div>
                  <div className="lp-mrow">
                    <span>#MB2399 · Yusupova M.</span>
                    <span className="lp-ob" style={{background:'rgba(16,185,129,0.15)',color:'#34d399'}}>Tayyor</span>
                    <span style={{color:'#34d399',fontWeight:700}}>7,200,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="lp-section" id="lp-features">
          <div className="lp-reveal">
            <div className="lp-sec-lbl">Imkoniyatlar</div>
            <h2 className="lp-sec-title">Biznesingizning barcha<br/>jarayonlari bir joyda</h2>
            <p className="lp-sec-sub">Qo'lda yozish, Excel jadvallar va chalkash xabarlardan xalos bo'ling.</p>
          </div>
          <div className="lp-features lp-reveal">
            {[
              ['📦','Buyurtmalar','Yangi → Jarayonda → Tayyor → Yetkazildi. Har bir bosqichni real-time kuzatish. Kechikkan buyurtmalarga avtomatik ogohlantirish.'],
              ['💰','Moliya','To\'lovlar, qarzlar, tushum hisoboti. Naqd, karta, bank. Chek chiqarish. Qarzdan oshib to\'lash bloklanadi.'],
              ['🏪','Omborxona','Material kirim-chiqim, kam qoldiq ogohlantirishlari, inventarizatsiya. Har bir harakatni qayd eting.'],
              ['👥','Mijozlar bazasi','Har bir mijozning buyurtmalari, to\'lov tarixi, qarzi bitta ekranda. Telegram orqali bildirishnomalar.'],
              ['✨','AI Yordamchi','Real CRM ma\'lumotlari asosida moliyaviy hisobotlar va tavsiyalar. Excel formatida yuklab olish.'],
              ['🤖','Telegram Bot','Yangi buyurtma, to\'lov, kechikkan buyurtmalar haqida Telegram orqali darhol xabar. Doim nazoratda.'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="lp-feat">
                <div className="lp-feat-icon">{icon}</div>
                <div className="lp-feat-title">{title}</div>
                <p className="lp-feat-desc">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ROLES */}
        <section className="lp-section lp-roles-bg" id="lp-roles">
          <div className="lp-reveal" style={{textAlign:'center'}}>
            <div className="lp-sec-lbl">Rollar</div>
            <h2 className="lp-sec-title">Har bir xodim uchun alohida panel</h2>
            <p className="lp-sec-sub" style={{margin:'0 auto'}}>Hech kim kerak bo'lmagan ma'lumotlarni ko'rmaydi.</p>
          </div>
          <div className="lp-roles lp-reveal">
            {[
              {icon:'👑',name:'Admin',color:'#2563eb',items:['Barcha hisobotlar','Xodimlarni boshqarish','Mahsulot va narxlar','Ombor nazorat','Mijozlar bazasi','AI yordamchi']},
              {icon:'💼',name:'Menejer',color:'#3b82f6',items:['Buyurtmalar boshqaruv','Mijozlar bilan ishlash','Mahsulotlar ko\'rish','To\'lov qabul qilish','Hisobotlar','AI yordamchi']},
              {icon:'📊',name:'Buxgalter',color:'#10b981',items:['Moliyaviy hisobotlar','To\'lovlar tarixi','Qarzlar nazorati','Daromad tahlili','Excel eksport','AI moliya tahlili']},
              {icon:'🏭',name:'Ishchi',color:'#60a5fa',items:['O\'z buyurtmalarini ko\'rish','Ombordan material olish','Holat yangilash','Xabarlar']},
            ].map(r => (
              <div key={r.name} className="lp-role" style={{'--rc':r.color}}>
                <span className="lp-role-icon">{r.icon}</span>
                <div className="lp-role-name">{r.name}</div>
                <ul className="lp-role-list">{r.items.map(it => <li key={it}>{it}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        {/* STATS BAND */}
        <div className="lp-band lp-reveal">
          <div className="lp-band-grid">
            {[
              ['3x','Tezroq buyurtma qayta ishlash'],
              ['0','Yo\'qolgan buyurtmalar'],
              ['24/7','Telegram orqali nazorat'],
              ['∞','Saqlanadigan tarix'],
            ].map(([n,l]) => (
              <div key={l} style={{textAlign:'center'}}>
                <div className="lp-band-num">{n}</div>
                <div className="lp-band-lbl">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TESTIMONIALS */}
        <section className="lp-section" id="lp-reviews">
          <div className="lp-reveal" style={{textAlign:'center'}}>
            <div className="lp-sec-lbl">Mijozlar fikri</div>
            <h2 className="lp-sec-title">50+ mebel do'koni bizga ishonadi</h2>
            <p className="lp-sec-sub" style={{margin:'0 auto'}}>Haqiqiy tajriba, haqiqiy natijalar.</p>
          </div>
          <div className="lp-testimonials lp-reveal">
            {[
              {quote:"Buyurtmalarni Excel da yuritardik. Endi hamma narsa avtomatik. Bitta oy ichida 2 ta yangi menejer ishga oldik, chunki vaqt bo'shadi.",name:'Bobur M.',role:'Toshkent Mebel — egasi',emoji:'👑',bg:'#1e3a5f'},
              {quote:"Moliya moduli zo'r! Qarz qilib olgan mijozlarimni real vaqtda ko'ryapman. Bitta oyda 4 million qarzni undirib oldik.",name:'Nilufar Q.',role:'Comfort Family — buxgalter',emoji:'💼',bg:'#1a2f1e'},
              {quote:"Telegram bot haqiqatan qulay. Omborda material tugayotganda darhol xabar keladi. Endi ombordan yetishmovchilik bo'lmaydi.",name:'Sherzod A.',role:'Premium Wood — omborchi',emoji:'🏭',bg:'#2d1f4f'},
            ].map((t,i) => (
              <div key={i} className="lp-tcard">
                <div className="lp-tstars">{[1,2,3,4,5].map(s=><span key={s} className="lp-tstar">★</span>)}</div>
                <p className="lp-tquote">{t.quote}</p>
                <div className="lp-tauthor">
                  <div className="lp-tavatar" style={{background:t.bg,border:'1px solid rgba(255,255,255,0.08)'}}>{t.emoji}</div>
                  <div>
                    <div className="lp-tname">{t.name}</div>
                    <div className="lp-trole">{t.role}</div>
                    <div className="lp-tverified">✓ Tasdiqlangan foydalanuvchi</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI */}
        <section className="lp-section lp-ai" id="lp-ai">
          <div className="lp-reveal">
            <div className="lp-sec-lbl">AI Yordamchi</div>
            <h2 className="lp-sec-title">Biznesingiz haqida savol bering</h2>
            <p className="lp-sec-sub">Real CRM ma'lumotlariga asoslanib javob beradi.</p>
            <ul style={{listStyle:'none',marginTop:26,display:'flex',flexDirection:'column',gap:11}}>
              {[
                'Bu oylik moliyaviy hisobot (Excel eksport bilan)',
                'Kechikkan buyurtmalar va risklar',
                'Savdoni oshirish bo\'yicha tavsiyalar',
                'Eng faol mijozlar va mahsulotlar tahlili',
              ].map(t => (
                <li key={t} style={{display:'flex',gap:10,alignItems:'flex-start',fontSize:13,color:' #7b8db0'}}>
                  <span style={{color:'#60a5fa',fontSize:15,flexShrink:0}}>✓</span>{t}
                </li>
              ))}
            </ul>
          </div>
          <div className="lp-chat lp-reveal">
            <div style={{fontSize:9,color:'#3d4e6b',marginBottom:14,textTransform:'uppercase',letterSpacing:1.2,fontWeight:700}}>
              AI Yordamchi · Demo
            </div>
            <div className="lp-cmsg user">
              <div className="lp-cavatar user">👤</div>
              <div className="lp-cbubble user">Bu oylik hisobotni tayyorla</div>
            </div>
            <div className="lp-cmsg">
              <div className="lp-cavatar ai">✨</div>
              <div className="lp-cbubble ai">
                <strong>Mart 2026 Moliyaviy Hisobot</strong><br/><br/>
                📊 Jami tushum: <strong style={{color:'#34d399'}}>48,200,000 so'm</strong><br/>
                📦 Buyurtmalar: <strong>24 ta</strong> (3 ta kechikkan)<br/>
                💰 Qolgan qarz: <strong style={{color:'#f87171'}}>2,400,000 so'm</strong><br/><br/>
                ✅ O'tgan oyga nisbatan 18% o'sish!
              </div>
            </div>
            <div className="lp-cmsg">
              <div className="lp-cavatar ai">✨</div>
              <div className="lp-cbubble ai">
                <div className="lp-typing"><span/><span/><span/></div>
              </div>
            </div>
            <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--bdr)',display:'flex',gap:6,flexWrap:'wrap'}}>
              {['📊 Hisobot','💡 Tavsiya','⚠️ Ogohlantirishlar'].map(t => (
                <span key={t} style={{
                  padding:'5px 10px',borderRadius:8,
                  background:'var(--acc-soft)',border:'1px solid var(--acc-border)',
                  fontSize:10,color:'var(--acc-light)',cursor:'pointer',fontWeight:600,
                }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="lp-section lp-pricing-bg" id="lp-pricing">
          <div className="lp-reveal" style={{textAlign:'center'}}>
            <div className="lp-sec-lbl">Narxlar</div>
            <h2 className="lp-sec-title">Biznesingiz hajmiga mos tarif</h2>
            <p className="lp-sec-sub" style={{margin:'0 auto'}}>Yashirin to'lovlar yo'q. Istalgan vaqt bekor qilishingiz mumkin.</p>
          </div>
          <div className="lp-pricing lp-reveal">
            <div className="lp-pcard">
              <div className="lp-pname">Boshlang'ich</div>
              <div className="lp-pdesc">Kichik do'konlar uchun</div>
              <div className="lp-pprice">Bepul</div>
              <div className="lp-pperiod">Har doim bepul</div>
              <ul className="lp-pfeats">
                {['5 tagacha foydalanuvchi','Buyurtmalar boshqaruvi','Asosiy hisobotlar','Telegram bildirishnoma'].map(f=><li key={f}>{f}</li>)}
              </ul>
              <button className="lp-pbtn outline" onClick={go}>Boshlash →</button>
            </div>
            <div className="lp-pcard lp-pfeat">
              <div className="lp-pbadge">🔥 Eng mashhur</div>
              <div className="lp-pname">Professional</div>
              <div className="lp-pdesc">O'sib borayotgan biznes</div>
              <div className="lp-pprice">299,000<span> so'm</span></div>
              <div className="lp-pperiod">/ oyiga</div>
              <ul className="lp-pfeats">
                {['Cheksiz foydalanuvchilar','AI Yordamchi','Excel hisobotlar','Shartnoma generatsiya','Inventarizatsiya moduli','Buxgalter paneli'].map(f=><li key={f}>{f}</li>)}
              </ul>
              <button className="lp-pbtn solid" onClick={go}>Sinab ko'rish →</button>
            </div>
            <div className="lp-pcard">
              <div className="lp-pname">Korporativ</div>
              <div className="lp-pdesc">Bir necha filiallar</div>
              <div className="lp-pprice">Kelishuv</div>
              <div className="lp-pperiod">individual narx</div>
              <ul className="lp-pfeats">
                {['Ko\'p filial qo\'llab-quvvatlash','Maxsus integratsiyalar','Dedicated support','Server ustida nazorat'].map(f=><li key={f}>{f}</li>)}
              </ul>
              <button className="lp-pbtn outline">Bog'lanish →</button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="lp-section" id="lp-faq">
          <div className="lp-reveal" style={{textAlign:'center'}}>
            <div className="lp-sec-lbl">Savollar</div>
            <h2 className="lp-sec-title">Ko'p so'raladigan savollar</h2>
            <p className="lp-sec-sub" style={{margin:'0 auto'}}>Javob topa olmadingizmi? Telegram orqali bog'laning.</p>
          </div>
          <div className="lp-faq lp-reveal">
            {[
              {q:"Telegram bot qanday ishlaydi?",a:"Bot sizning CRM hisobingizga ulangan. Yangi buyurtma, to'lov, kechikkan yetkazib berish haqida avtomatik xabar yuboradi."},
              {q:"Ma'lumotlarim qanchalik xavfsiz?",a:"Barcha ma'lumotlar shifrlangan (HTTPS, AES-256) va kunlik zaxira nusxa olinadi. Faqat siz va ruxsat bergan xodimlaringiz ko'ra oladi."},
              {q:"Bir necha filialda ishlatish mumkinmi?",a:"Ha, Korporativ tarif orqali bir necha filial va omborni alohida yoki birgalikda boshqarish mumkin."},
              {q:"Excel dan import qila olamanmi?",a:"Ha. Mavjud mijozlar, mahsulotlar va buyurtmalarni Excel (.xlsx) formatida yuklash imkoniyati mavjud. Jarayon bir necha daqiqa oladi."},
              {q:"Pullik tarifdan bepul tarifga o'tish mumkinmi?",a:"Albatta. Istalgan vaqt tarifni o'zgartirish yoki bekor qilish mumkin. Keyingi to'lov sanasigacha hizmat ko'rsatiladi."},
              {q:"Texnik yordam qancha vaqtda javob beradi?",a:"Professional va Korporativ tarif uchun Telegram orqali 2 soat ichida. Bepul tarif uchun 24 soat ichida."},
            ].map((item,i) => (
              <div key={i} className="lp-fitem" id={`faq-${i}`}
                onClick={()=>{ const el=document.getElementById(`faq-${i}`); if(el) el.classList.toggle('open') }}>
                <div className="lp-fq"><span>{item.q}</span><span className="lp-farrow">+</span></div>
                <div className="lp-fa">{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta">
          <div className="lp-reveal">
            <h2>
              Biznesingizni bugun<br/>
              <span style={{
                background:'linear-gradient(135deg,#93c5fd,#2563eb)',
                WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
              }}>raqamlashtiring</span>
            </h2>
            <p className="lp-cta-sub">Ro'yxatdan o'tish 2 daqiqa. Kredit kartasi kerak emas.</p>
            <div className="lp-cta-btns">
              <button className="lp-btn-primary" onClick={go}>Bepul boshlash →</button>
              <a href="https://t.me/emebel_crm" className="lp-btn-secondary">💬 Telegram</a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          <img src="/logo (2).png" alt="e-Mebel CRM"
            style={{height:32,width:'auto',objectFit:'contain',opacity:.8}}/>
          <div className="lp-footer-links">
            <a href="#lp-features">Imkoniyatlar</a>
            <a href="#lp-roles">Rollar</a>
            <a href="#lp-pricing">Narxlar</a>
            <a href="#lp-faq">FAQ</a>
            <a href="#" onClick={go}>Kirish</a>
          </div>
          <div className="lp-footer-copy">© 2026 e-Mebel CRM</div>
        </footer>

      </div>
    </>
  )
}