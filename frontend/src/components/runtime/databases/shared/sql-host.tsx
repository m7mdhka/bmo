"use client";

import type { DbConfigByEngine, DbEngine, SqlHostConfig } from "../types";
import type { EngineContext } from "../engine-definition";
import { Field } from "../form/field";

type SqlHostEngine = {
  [E in DbEngine]: DbConfigByEngine[E] extends SqlHostConfig ? E : never;
}[DbEngine];

export function setSqlHostConfig<E extends SqlHostEngine>(ctx: EngineContext<E>, next: SqlHostConfig) {
  ctx.onChange({ ...ctx.details, config: next });
}

export function SqlHostFields<E extends SqlHostEngine>({ ctx }: { ctx: EngineContext<E> }) {
  const c = ctx.details.config;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Host">
        <input
          value={c.host}
          onChange={(e) => setSqlHostConfig(ctx, { ...c, host: e.target.value })}
          placeholder="localhost"
          className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </Field>
      <Field label="Port">
        <input
          value={String(c.port)}
          onChange={(e) => setSqlHostConfig(ctx, { ...c, port: Number(e.target.value || 0) })}
          inputMode="numeric"
          className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </Field>
      <Field label="Database">
        <input
          value={c.database}
          onChange={(e) => setSqlHostConfig(ctx, { ...c, database: e.target.value })}
          className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </Field>
      <Field label="Username">
        <input
          value={c.username}
          onChange={(e) => setSqlHostConfig(ctx, { ...c, username: e.target.value })}
          className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </Field>
      <Field label="Password">
        <input
          value={c.password}
          onChange={(e) => setSqlHostConfig(ctx, { ...c, password: e.target.value })}
          type="password"
          placeholder="(optional)"
          className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </Field>
      <Field label="SSL">
        <select
          value={c.ssl}
          onChange={(e) => setSqlHostConfig(ctx, { ...c, ssl: e.target.value as SqlHostConfig["ssl"] })}
          className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="disable">Disable</option>
          <option value="require">Require</option>
        </select>
      </Field>
    </div>
  );
}
