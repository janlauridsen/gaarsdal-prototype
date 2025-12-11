export function Hero({ title, lead, primary, secondary }) {
  return (
    <section className="bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-28 text-center">
        <h1 className="text-h1 font-light text-text mb-6">{title}</h1>
        <p className="text-base-lg text-muted max-w-3xl mx-auto mb-8">{lead}</p>
        <div className="flex gap-4 justify-center">
          <a href={primary.href} className="inline-block bg-accent text-white rounded-lg px-6 py-3 font-medium">{primary.label}</a>
          <a href={secondary.href} className="inline-block border-2 border-accent text-accent rounded-lg px-5 py-3">{secondary.label}</a>
        </div>
      </div>
    </section>
  )
}
