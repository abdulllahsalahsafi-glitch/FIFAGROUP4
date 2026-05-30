import React from 'react';

const errorBoundaryCss = `
.appErrorBoundary{
  min-height:100vh;
  min-height:100dvh;
  width:100%;
  box-sizing:border-box;
  display:grid;
  place-items:center;
  padding:calc(22px + env(safe-area-inset-top)) 16px calc(22px + env(safe-area-inset-bottom));
  direction:rtl;
  color:#EDF0FF;
  font-family:'Tajawal',Arial,sans-serif;
  background:
    radial-gradient(ellipse 320px 160px at 50% -2%,rgba(0,230,118,.12) 0%,transparent 65%),
    radial-gradient(circle at 8% 6%,rgba(0,212,255,.10) 0%,transparent 50%),
    linear-gradient(135deg,#02030A 0%,#061225 48%,#02030A 100%);
}
.appErrorBoundaryCard{
  width:min(430px,calc(100vw - 32px));
  box-sizing:border-box;
  border-radius:28px;
  padding:24px 18px 20px;
  text-align:right;
  background:linear-gradient(145deg,rgba(4,12,28,.94),rgba(6,15,34,.86));
  border:1px solid rgba(239,68,68,.26);
  box-shadow:0 34px 80px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.08);
  backdrop-filter:blur(22px);
  -webkit-backdrop-filter:blur(22px);
}
.appErrorBoundaryIcon{
  width:54px;
  height:54px;
  border-radius:18px;
  display:grid;
  place-items:center;
  margin:0 0 14px auto;
  color:#FCA5A5;
  background:rgba(239,68,68,.12);
  border:1px solid rgba(239,68,68,.24);
  font-size:28px;
  font-weight:1000;
}
.appErrorBoundary h1{
  margin:0;
  color:#F8FAFC;
  font-size:24px;
  line-height:1.25;
  font-weight:1000;
}
.appErrorBoundary p{
  margin:10px 0 0;
  color:#AAB4D5;
  font-size:14px;
  line-height:1.7;
  font-weight:800;
}
.appErrorBoundary button{
  width:100%;
  min-height:46px;
  margin-top:18px;
  border:0;
  border-radius:18px;
  color:#02030A;
  font-size:15px;
  font-weight:1000;
  background:linear-gradient(135deg,#00E676,#00D4FF);
  cursor:pointer;
  font-family:'Tajawal',Arial,sans-serif;
  box-shadow:0 14px 30px rgba(0,230,118,.18);
}
.appErrorBoundaryDetails{
  margin-top:14px;
  padding:10px 12px;
  border-radius:14px;
  direction:ltr;
  text-align:left;
  color:#CBD5E1;
  background:rgba(2,6,23,.56);
  border:1px solid rgba(255,255,255,.08);
  font-size:11px;
  line-height:1.45;
  white-space:pre-wrap;
  overflow:auto;
  max-height:130px;
}
`;

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FIFA GROUP render error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const errorMessage = this.state.error?.message || '';

    return (
      <main className="appErrorBoundary">
        <style>{errorBoundaryCss}</style>
        <section className="appErrorBoundaryCard" role="alert">
          <div className="appErrorBoundaryIcon">!</div>
          <h1>حدث خطأ غير متوقع في التطبيق</h1>
          <p>
            لم يتم فقدان بياناتك. أعد تحميل التطبيق، وإذا تكرر الخطأ صوّر الشاشة وأرسلها لفريق FIFA.
          </p>
          <button type="button" onClick={this.handleReload}>
            إعادة تحميل التطبيق
          </button>
          {errorMessage ? (
            <pre className="appErrorBoundaryDetails">{errorMessage}</pre>
          ) : null}
        </section>
      </main>
    );
  }
}
