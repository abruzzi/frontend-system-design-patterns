## 1. Hook

A few years ago,
most of our discussions were about:

* should we use Redux or React Context API
* should we fetch data inside `useEffect`, or do we do preload in Relay
* how to structure components properly in a project

And those were the problems we spent most of our time on.

But recently,
a different set of terms started showing up everywhere:

* MCP
* Agents
* Agentic coding
* Agent Skills

And if you’re working in frontend,
it’s easy to feel disconnected from all of this.

It can feel like:

> is this something for AI engineers…
> or does it actually affect how we build frontend applications?

In this video,
I’m going to take a step back.

I’ll walk through these ideas in **one clear order**.

And I’ll connect each step to something you already understand.

---

## 2. What we’ll cover

I’ll define **agents** with one concrete analogy.

Then I’ll show where the same pattern shows up in **chat and IDE products**.

After that, **agentic coding** — goal-driven loops while you’re building software.

We’ll separate **prompts**, **tools**, and **skills**: what each is, and where each comes from.

Then **context** — what the agent sees each step, including tool results.

And finally **MCP**, as standard wiring for external tools.

---

## 3. Framing the shift

If I had to summarise the shift in one sentence,
it would be this:

> Traditionally, we write code by explicitly defining the steps.
> With agentic coding, we start defining goals,
> and let the system figure out how to get there.

That might sound abstract.

So we’ll define **agent** first.

Then **agentic coding**.

Then **prompts**, **tools**, and **skills**.

And finally, how **context** and **MCP** fit around that stack.

---

## 4. What is an agent? (with demo)

Let’s start with the core term: **agent**.

At a high level:

> An agent is a system that can take a **goal**,
> decide what to do next,
> and **perform actions** that change the world (or the UI),
> then use feedback and keep going until the goal is met or blocked.

That’s the whole pattern: **goal → decide → act → observe → repeat**.

Instead of staying in theory,
let’s look at a quick example.

👉 (switch to your curl vs browser demo)

---

### After demo — what that example was really showing

With `curl`,
the interaction is very direct:

* you send a request
* you get a response
* and that’s the end of the story

There’s no ongoing loop.

**You** are the agent planning the next step.

When you open the same URL in a **browser**,
the runtime keeps making decisions:

* interpret the response
* decide what else to load
* run scripts
* handle errors and fallbacks
* repaint

So the browser isn’t just a pipe.

It’s a **longer-lived loop**.

The implicit goal is something like:
render this page correctly, and keep it working as resources arrive.

That loop — **goal, actions, feedback** —
is what people mean when they say **agent** in systems discussions.

One important caveat.

We’re not claiming Chrome **is** an LLM.

We’re only saying it’s a useful **mental model**.

An agent is whatever sits in that **decide, act, observe** loop.

---

## 5. Same pattern: where you already meet an “agent” in AI products

So we have a pattern: **goal → decide → act → observe**.

The browser was one example of a **non-chat** agentic loop.

Here’s the part people often skip.

When you talk to **ChatGPT**, **Claude**, or **Cursor’s agent**,
it *feels* like you’re talking to the model.

You’re not talking to raw weights alone.

You’re talking to a **product**.

That product wraps the model in **that same loop**:

* it receives your **goal** — your message
* it assembles **context**: instructions, memory, files, and whatever came back from earlier steps
* the model proposes **what to do next**
* the host may run **tools** — search, files, APIs, and so on
* results feed back into that context
* the loop continues until the product decides to stop

We’ll define **context**, **tools**, and **skills** precisely in a moment.

Until then, notice the shape. A goal goes in. Actions go out. Observations come back in.

So the sentence I want you to remember is:

> You’re already interacting with an **agent system**.
> The model is one component inside it. It’s not the whole thing.

Nothing mystical happened between “browser” and “ChatGPT.”

It’s the **same structural idea**.

Something other than you is running the loop.

Once that’s clear,
**agentic coding** has an obvious definition.

That’s the next section.

---

## 6. Agentic coding — the same loop applied to *building* software

**Agentic coding** means you’re not only using an agent to **answer questions**.

You’re using it to **change a codebase** toward an outcome.

Same pattern:

* **Goal:** “fix this bug,” “add this feature,” “refactor this module.”
* **Decide:** plan steps, read files, pick strategies.
* **Act:** edit files, run tests, use the terminal — whatever the product allows (some can even open PRs for you).
* **Observe:** build output, test failures, linter, diff.

So it’s not a separate magic term.

It’s **agentic** because control flow is **not fully written in advance by you**.

It’s **chosen during the run** by the system.

Still within the guardrails the product gives you.

Compare that to traditional frontend code you write by hand:

```js
const data = await fetchUser()
const transformed = transform(data)
const withFallbacks = applyFallbacks(transformed)
render(withFallbacks)
```

**You** fixed the order.

**You** fixed the error handling and the fallbacks.

With agentic coding, you still steer.

But you increasingly say something closer to:

> given this situation, get to a correct, reviewable result

and the **loop** fills in many micro-steps.

---

### A familiar parallel (imperative → declarative)

We’ve seen a related shift before.

**Imperative DOM:**

```js
const div = document.createElement('div')
div.innerText = 'Hello'
document.body.appendChild(div)
```

**Declarative React:**

```jsx
<div>Hello</div>
```

You described **what** should be true.

Not every micro-step the runtime should take.

Agentic coding rhymes with that:

* less “type every statement”
* more “define outcomes, constraints, and safe operations —
  let the loop navigate.”

---

## 7. Prompts, tools, skills — in that order, with definitions and “where they come from”

Now we name the pieces we’ve been pointing at.

We’ll go **in dependency order**:

what you say, then what the host can run, then how your team standardizes recurring work.

Think of it as three **layers** on top of the same loop.

---

### First — the prompt (what you ask, right now)

Start with the **prompt**.

That’s simply **what you tell the agent to do** in this session, or in this turn.

For example, you might say: “implement assigning a user to a card.”

Or: “refactor this component.”

That always comes from **you**, the human, fresh each time.

There are three consequences.

First, it’s mostly **one-off**, even when you reuse a template.

Second, it’s **sensitive to phrasing**. Small wording changes can change what happens.

Third, by itself, it does **not** carry your whole org’s process.

So in the loop, the prompt is the **immediate goal**.

---

### Second — tools (what the host can run)

Next: **tools**.

A tool is a **named capability with a contract** — something the host can **invoke** for the agent, with inputs and outputs.

Think **function call**, **API call**, **script**.

Concrete examples: read a file, run tests, query a database, hit an HTTP endpoint.

Where do those come from?

Usually the **product** gives you a baseline — filesystem, terminal, maybe browser tools.

**You** or your platform can register more.

And we’ll get to **MCP** later as a standard way for **servers** to expose more tools.

Here’s the important limitation.

Tools answer a narrow question. **What can be executed?**

They usually do **not** spell out *your team’s* full workflow from A to Z.

So if you only give tools, the agent can definitely **do things**.

But it may do them **inconsistently** — because nobody wrote down *how we always do this here.*

---

### Third — skills (repeatable playbooks)

Finally: **skills**.

A skill is a **documented workflow** — reusable instructions for **when** this kind of task applies, and **how** to do it well **in this repo**, **in this team’s style**.

Examples: “how we implement a feature with TDD in this project,” or “how we add a data-fetching path with MSW in tests.”

Where do those live?

Often **in your repository** — for example `.cursor/skills/.../SKILL.md`.

Sometimes they ship as product templates.

And like good conventions, they’re **versioned with the code**.

A skill is **not** one tool call.

It’s the **glue** between tools: **which** tools matter, **in what order**, **what to check**, and what **done** means for your team.

---

### Recap

If you boil the three down:

The **prompt** is what you want **right now**.

The **tool** is what the agent is **allowed to run**.

The **skill** is how your team wants **whole classes of work** done **repeatably**.

---

### Why tools come before skills

We introduced **skills** after **tools** on purpose.

Without tools, “skills” sound like vague magic.

Without skills, tools alone explain the **inconsistency** you see in real projects.

---

### Coming up: a separate video on skills

We’ve only **defined** skills here.

How they sit **after** prompts, and **on top of** tools.

Soon after this video,
I’m releasing a **separate episode dedicated entirely to skills**.

How to write them.

Where to put them.

How to connect them to real workflows in a project.

In that follow-up, we’ll take a concrete example and show:

* how to define skills so they’re actually usable
* how to encode system design decisions the agent can follow
* and what changes in the code the agent produces

---

## 8. Context — everything in the loop at decision time

We already used the word **context** when we described chat and IDE products.

Here’s the clean definition.

**Context** means **everything the agent can see** when it decides the next step.

That usually includes your **prompt**, the product’s **system instructions**, **open files** and diffs, **tool results** from earlier in the loop, and sometimes **retrieved docs** or notes — including via MCP.

If you’re a frontend developer, treat it like **React state** in one specific way.

When state is clean, relevant, and well scoped, the UI behaves predictably.

When it’s messy, incomplete, or contradictory, you get weird bugs.

Agents behave the same way.

**Better context, better plans** — and fewer nasty surprises.

So a big part of agentic engineering is **designing what you inject**.

And **what you deliberately leave out**.

---

## 9. MCP — a standard *plumbing* layer for tools

**Tools** can come from the product itself.

They can also come from **outside**, through a standard hook.

That hook is what people mean by **MCP**.

You don’t need to love the acronym.

You need to know **where it sits**.

**MCP** is a **standard way to expose tools and data** to agent hosts — so every integration doesn’t turn into its own snowflake.

Without that kind of standard, you end up with custom glue everywhere.

With it, capabilities are **discoverable** and **callable** in a more uniform shape.

Picture this: an MCP server hooked to Obsidian exposes tools like “search notes” and “read note.”

Cursor — or another host — connects to that server.

Suddenly that **tool** exists inside the loop, and the model can ask for it when it’s useful.

We’re still looking at the **same stack** we already defined.

**MCP** is the new piece: **transport and discovery**, so **external** things show up as **tools**.

A **tool** is still **one callable operation** the host exposes.

A **skill** is still **how you prefer to combine tools and process** for recurring work.

---

## 10. Bring it together

Here’s the whole picture, end to end.

An **agent** is the **loop**. Goal, decide, act, observe.

**Agentic coding** is that same loop applied to **changing real software**, not just chat answers.

The **prompt** is your **current goal**.

**Tools** are **executable capabilities**. They come from the product, from you, or through MCP.

**Skills** are **team playbooks** so recurring work stays consistent.

**Context** is **what the loop sees** when it decides.

**MCP** is **standard wiring** so more tools can exist without bespoke integrations.

---

## 11. Why this matters for frontend developers

It doesn’t mean we stop writing code.

It means more of our leverage moves “up stack”:

* designing **clear boundaries** and **safe operations** (good tools)
* encoding **workflows** we care about (skills)
* curating **context** so plans don’t hallucinate structure

The same instincts that make frontend systems maintainable —

APIs, data modeling, predictable state —

are the same instincts that make **agentic** workflows trustworthy.

---

## 12. Ending

We’re still early in this shift.

A lot of patterns are not fully settled yet.

But one thing is becoming clearer:

> we’re moving from typing every micro-step
> to designing **systems** — prompts, tools, skills, context —
> that can carry a goal across many actions

---

## 13. CTA

If you’re interested in this direction,
I’ll be exploring more topics like:

* designing APIs for agents
* how this changes frontend architecture
* and how to apply this in real projects

If you want to follow along, subscribe.

Thanks for watching, and I’ll see you in the next one.
