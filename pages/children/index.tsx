import React, { useState } from "react"
import Head from "next/head"
import Image from "next/image"

type ProblemType = "schoolrefusal" | "social" | "performance" | "sleep" | "selfimage" | "bullying" | null

const problems = {
  schoolrefusal: {
    title: "Won't go to school",
    experience: "Every morning is a battle. Your child won't get up. First a stomachache, then a headache, then they can't. You don't know if you should be firm or soft. Is it anxiety or manipulation? You've started to doubt yourself. Your own work suffers.",
    whathappens: "School refusal is rarely laziness. It's anxiety that has become a physical reaction — the body responds for real. Your child isn't lying. They've learned that school means danger — socially, academically, or both. That belief sits deep and won't reach them through conversation alone.",
    whathelps: "Works directly with the belief driving the reaction — without your child needing to understand why. They get new inner images of themselves at school. Safe instead of dangerous. Results typically come quickly because children don't spend energy doubting themselves in the process.",
  },
  social: {
    title: "Feels left out",
    experience: "Your child sits alone on weekends while other kids are together. You don't hear about birthday parties. Maybe they're not invited. You arrange playdates that don't lead to friendships. You don't know if it's chosen loneliness or painful exclusion. You sleep poorly over it.",
    whathappens: "Your child has a fixed belief about themselves: 'I'm boring', 'they don't like me', 'I don't know what to say', 'I don't fit in.' It controls their behavior completely. They withdraw, others interpret it as disinterest, distance grows. The cycle reinforces itself.",
    whathelps: "Works with the basic self-perception — not social skills. Your child doesn't need to learn techniques. They need a new starting point. A child who deep down believes they're worth knowing behaves differently without being taught.",
  },
  performance: {
    title: "Crashes during exams",
    experience: "Your child is intelligent and functions well in everyday life — but crashes during tests and exams. Grades don't reflect what they can do. They're in panic weeks before a test. Sleep poorly, eat poorly, become irritable. You try to motivate and reassure — nothing works.",
    whathappens: "Performance anxiety isn't lack of knowledge or preparation. It's a belief that results define worth as a person — and an expectation of failure. The body activates a real stress response that blocks access to what the child actually knows.",
    whathelps: "Two things at once. Works with the belief that results define worth — and trains the body in a different physiological response to test situations. Your child learns to activate calm and focus instead of panic. It's a real change in the nervous system.",
  },
  sleep: {
    title: "Can't sleep / Constant worry",
    experience: "Your child won't sleep alone, or lies awake for hours. Maybe wakes with nightmares or worry you can't explain. You lie awake listening. You're exhausted. Your relationship now revolves only around sleep — every evening is negotiation.",
    whathappens: "Sleep problems in children are rarely the sleep problem itself. It's anxiety manifesting at night when there are no distractions. Your child is alone with their thoughts and has no strategy to handle them. Thoughts loop. The body is activated when it should be winding down.",
    whathelps: "Sleep is one of hypnotherapy's strongest areas because hypnotic state and sleep onset activate the same neurological mechanisms. Your child learns to guide themselves into calm — through new inner images. Results typically come quickly.",
  },
  selfimage: {
    title: "Poor self-image",
    experience: "Your child says 'I'm stupid', 'I'm ugly', 'nobody likes me', 'I'm bad at everything.' You reject it — 'that's not true, you're amazing' — and your child shuts down. Your reassurance doesn't work. You see a child who can't accept love.",
    whathappens: "Self-image is the sum of all beliefs your child has about themselves — and most aren't consciously chosen. Positive feedback is rejected because it doesn't fit the existing self-image. Criticism confirms it. The system reinforces itself.",
    whathelps: "Self-image is the deepest work area because beliefs sit below conscious thought. Hypnotherapy goes there and replaces old beliefs with new ones — not as positive thinking but as real experience. Your child receives it in a way few adults can.",
  },
  bullying: {
    title: "Being bullied",
    experience: "You find out too late. Your child has hidden it — from shame, from fear it will get worse. When you finally know, you're angry, heartbroken, and helpless. You contact the school. There are meetings. It promises to improve. But your child isn't the same. Smaller. More withdrawn.",
    whathappens: "Bullying leaves behind beliefs, not just bad memories. 'I deserve it', 'there's something wrong with me', 'I can't trust others', 'it's not safe to be visible.' Your child interprets injustice as their own fault. The shame is biggest.",
    whathelps: "Works directly with beliefs bullying has left behind. Your child doesn't need to retell what happened. It works with what your child believes about themselves now — and replaces it with an experience of integrity that doesn't depend on what others have done.",
  },
}

export default function ChildrenPage() {
  const [selected, setSelected] = useState<ProblemType>(null)

  return (
    <>
      <Head>
        <title>Help for children | Gaarsdal Hypnotherapy</title>
        <meta name="description" content="Hypnotherapy for children with anxiety, social problems, performance anxiety and more." />
      </Head>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.6, color: "#333" }}>
        
        {/* SECTION 1: RECOGNITION */}
        <section style={{ marginBottom: "60px", textAlign: "center" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 600, marginBottom: "12px" }}>Your child is struggling — and you don't know what to do</h1>
          <p style={{ fontSize: "18px", color: "#666", marginBottom: "20px" }}>You've tried a lot. Maybe the system. Maybe friends. You love your child and can't reach them. It's not your fault.</p>
          <p style={{ fontSize: "16px", color: "#555" }}>I work with children and young people struggling with anxiety, social problems, self-image, sleep issues, and performance anxiety. I help them become more themselves again — and help you understand what's happening.</p>
          <div style={{ marginTop: "30px" }}>
            <Image src="/Jan-AI.png" alt="Jan Lauridsen" width={150} height={150} style={{ borderRadius: "50%", objectFit: "cover" }} />
          </div>
        </section>

        {/* SECTION 2: CHOOSE PROBLEM */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", textAlign: "center" }}>Recognize your child:</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "40px" }}>
            {Object.entries(problems).map(([key, prob]) => (
              <button
                key={key}
                onClick={() => setSelected(key as ProblemType)}
                style={{
                  padding: "20px",
                  border: selected === key ? "2px solid #5a7a8f" : "1px solid #ddd",
                  background: selected === key ? "#f0f4f8" : "#fff",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: 500,
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                {prob.title}
              </button>
            ))}
          </div>
        </section>

        {/* SECTION 3: DEEP DIVE */}
        {selected && problems[selected] && (
          <section style={{ marginBottom: "60px", padding: "30px", background: "#f9fafb", borderRadius: "8px" }}>
            <h3 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "20px" }}>{problems[selected].title}</h3>

            <div style={{ marginBottom: "30px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", color: "#888", marginBottom: "12px" }}>Your experience</h4>
              <p style={{ fontSize: "15px", lineHeight: 1.7 }}>{problems[selected].experience}</p>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", color: "#888", marginBottom: "12px" }}>What's happening in your child</h4>
              <p style={{ fontSize: "15px", lineHeight: 1.7 }}>{problems[selected].whathappens}</p>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", color: "#888", marginBottom: "12px" }}>How hypnotherapy helps</h4>
              <p style={{ fontSize: "15px", lineHeight: 1.7 }}>{problems[selected].whathelps}</p>
            </div>

            <button
              onClick={() => setSelected(null)}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                background: "transparent",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
                color: "#666",
              }}
            >
              Close
            </button>
          </section>
        )}

        {/* SECTION 4: CONSULTATION */}
        <section style={{ marginBottom: "60px", padding: "40px", background: "#f5f7fa", borderRadius: "8px", textAlign: "center" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Start here</h2>
          <p style={{ fontSize: "16px", marginBottom: "24px", maxWidth: "600px", margin: "0 auto 24px" }}>
            A brief consultation — just you and Jan — where you tell about your child and get answers to your questions. No obligation. Just an honest conversation about what's possible.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", maxWidth: "500px", margin: "0 auto 30px" }}>
            <a
              href="tel:+4542807474"
              style={{
                padding: "12px 24px",
                background: "#5a7a8f",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "4px",
                fontWeight: 500,
                fontSize: "15px",
              }}
            >
              📞 Call +45 42 80 74 74
            </a>
            <a
              href="mailto:jan@gaarsdal.net"
              style={{
                padding: "12px 24px",
                background: "#e8eef5",
                color: "#5a7a8f",
                textDecoration: "none",
                borderRadius: "4px",
                fontWeight: 500,
                fontSize: "15px",
              }}
            >
              ✉️ Send email
            </a>
          </div>

          <p style={{ fontSize: "13px", color: "#888" }}>Everything you share is confidential. We comply with GDPR.</p>
        </section>

      </div>
    </>
  )
}
