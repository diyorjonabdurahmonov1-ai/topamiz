import Script from "next/script";

// Both are opt-in — the site works fine with neither configured. See
// AGENTS.md's Deployment section for where the IDs come from and which
// env var turns each one on; both can run side by side.
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const YANDEX_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

export default function Analytics() {
  return (
    <>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');`}
          </Script>
        </>
      )}

      {YANDEX_ID && (
        <>
          <Script id="yandex-metrika-init" strategy="afterInteractive">
            {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

              ym(${YANDEX_ID}, "init", {
                   clickmap:true,
                   trackLinks:true,
                   accurateTrackBounce:true,
                   webvisor:true
              });`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element -- Yandex Metrika's own no-JS fallback pixel, not an optimizable asset */}
            <img src={`https://mc.yandex.ru/watch/${YANDEX_ID}`} style={{ position: "absolute", left: "-9999px" }} alt="" />
          </noscript>
        </>
      )}
    </>
  );
}
