import React from "react";
import { FaArrowRight, FaCheckCircle, FaCode, FaGraduationCap } from "react-icons/fa";
import "./AuthLayout.css";

export default function AuthLayout({ children, variant = "login" }) {
  const isSignup = variant === "signup";

  return (
    <div className={`cc-auth-page cc-auth-page--${variant}`}>
      <div className="cc-auth-layout">
        <aside className="cc-auth-intro">
          <div className="cc-auth-brand-mark" aria-hidden="true">
            <FaCode />
          </div>
          <p className="cc-auth-eyebrow">CODE CAMPUS</p>
          <h1>{isSignup ? "Your next chapter starts here." : "Welcome back to your campus."}</h1>
          <p className="cc-auth-intro-copy">
            {isSignup
              ? "Learn new skills, build with confidence, and connect with a community that helps you grow."
              : "Pick up where you left off and keep building the skills that move you forward."}
          </p>

          <div className="cc-auth-code-card" aria-label="A small code preview">
            <div className="cc-auth-code-toolbar">
              <span /><span /><span />
              <small>your-next-step.js</small>
            </div>
            <div className="cc-auth-code">
              <span className="cc-code-muted">01</span>
              <span><b>const</b> nextStep = <i>"keep learning"</i>;</span>
              <span className="cc-code-muted">02</span>
              <span><b>while</b> (curious) {"{"}</span>
              <span className="cc-code-muted">03</span>
              <span className="cc-code-indent">buildSomethingGreat();</span>
              <span className="cc-code-muted">04</span>
              <span>{"}"}</span>
              <span className="cc-code-muted">05</span>
              <span className="cc-code-cursor" aria-hidden="true" />
            </div>
          </div>

          <div className="cc-auth-highlights">
            <span><FaGraduationCap /> Learn at your pace</span>
            <span><FaCheckCircle /> Make real progress</span>
          </div>
          <div className="cc-auth-note">
            <span>Small steps. Big possibilities.</span>
            <FaArrowRight aria-hidden="true" />
          </div>
        </aside>

        <section className="cc-auth-form-panel">
          {children}
        </section>
      </div>
    </div>
  );
}
