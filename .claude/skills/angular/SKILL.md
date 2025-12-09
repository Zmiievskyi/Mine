---
name: angular
description: Expert knowledge for Angular 21+ with Spartan UI. Use when building Angular components, services, or integrating with NestJS backend.
---

# Angular Framework Skill

## Quick Reference

### MineGNK Tech Stack

- **Angular**: 21+ with standalone components
- **UI Library**: Spartan UI (`@spartan-ng/brain` + `libs/ui/` Helm components)
- **Styling**: Tailwind CSS v4
- **Icons**: `@ng-icons/lucide`
- **State**: Angular Signals (`signal()`, `computed()`, `effect()`)
- **Toasts**: `ngx-sonner` via `NotificationService`

### Standalone Components

```typescript
// app.component.ts
import { Component, signal, computed, input, output, inject } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { HlmBadgeDirective } from '@spartan-ng/helm/badge';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HlmButtonDirective, HlmBadgeDirective],
  template: `
    <h1>{{ title() }}</h1>
    @if (loading()) {
      <p>Loading...</p>
    } @else {
      <ul>
        @for (item of items(); track item.id) {
          <li>
            {{ item.name }}
            <span hlmBadge [variant]="item.active ? 'default' : 'secondary'">
              {{ item.status }}
            </span>
          </li>
        }
      </ul>
    }
    <button hlmBtn (click)="refresh.emit()">Refresh</button>
  `,
})
export class AppComponent {
  private http = inject(HttpClient);

  // Signal inputs/outputs (Angular 21+)
  userId = input.required<string>();
  refresh = output<void>();

  title = signal('My App');
  items = signal<Item[]>([]);
  loading = signal(true);
  itemCount = computed(() => this.items().length);

  ngOnInit() {
    this.http.get<Item[]>('/api/items').subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
```

### Services

```typescript
// services/item.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private http = inject(HttpClient);

  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>('/api/items');
  }

  createItem(item: ItemCreate): Observable<Item> {
    return this.http.post<Item>('/api/items', item);
  }
}
```

### Spartan UI Components

Available in `frontend/libs/ui/`:

| Component | Import From | Example |
|-----------|-------------|---------|
| `hlmBtn` | `@spartan-ng/helm/button` | `<button hlmBtn>Click</button>` |
| `hlm-table` | `@spartan-ng/helm/table` | `<table hlmTable>` |
| `hlm-dialog` | `@spartan-ng/helm/dialog` | `<hlm-dialog [state]="'open'">` |
| `hlm-tabs` | `@spartan-ng/helm/tabs` | `<hlm-tabs tab="overview">` |
| `hlmBadge` | `@spartan-ng/helm/badge` | `<span hlmBadge>Status</span>` |
| `hlmInput` | `@spartan-ng/helm/input` | `<input hlmInput />` |
| `hlmLabel` | `@spartan-ng/helm/label` | `<label hlmLabel>Name</label>` |
| `hlm-select` | `@spartan-ng/helm/select` | `<hlm-select>` |
| `hlm-toaster` | `@spartan-ng/helm/sonner` | `<hlm-toaster />` |

### Spartan UI Dialog (IMPORTANT)

Dialogs **require** the `*brnDialogContent` structural directive for lazy rendering:

```typescript
@Component({
  imports: [BrnDialogImports, HlmDialogImports, HlmButton],
  template: `
    <!-- ✅ Correct: content rendered only when dialog opens -->
    <hlm-dialog [state]="isOpen() ? 'open' : 'closed'" (closed)="close()">
      <hlm-dialog-content *brnDialogContent="let ctx" class="sm:max-w-md">
        <hlm-dialog-header>
          <h3 hlmDialogTitle>Dialog Title</h3>
          <p hlmDialogDescription>Description text</p>
        </hlm-dialog-header>

        <div class="py-4">Content here</div>

        <hlm-dialog-footer>
          <button hlmBtn variant="outline" (click)="close()">Cancel</button>
          <button hlmBtn (click)="confirm()">Confirm</button>
        </hlm-dialog-footer>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class MyComponent {
  isOpen = signal(false);
  close() { this.isOpen.set(false); }
}
```

**Common Error**: `NG0201: No provider found for BrnDialogRef`
- **Cause**: Missing `*brnDialogContent` directive
- **Fix**: Add `*brnDialogContent="let ctx"` to `<hlm-dialog-content>`

Without `*brnDialogContent`, components like `hlmDialogTitle` try to inject `BrnDialogRef` before the dialog opens.

### NotificationService (Toasts)

```typescript
import { NotificationService } from '@app/core/services/notification.service';

private notify = inject(NotificationService);

this.notify.success('Node assigned successfully');
this.notify.error('Failed to fetch nodes');
this.notify.warning('Rate limit approaching');
```

### Proxy Configuration

```json
// proxy.conf.json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

```bash
ng serve --proxy-config proxy.conf.json
```

### Signals and Effects

```typescript
import { signal, computed, effect } from '@angular/core';

// Reactive state
const count = signal(0);
const doubled = computed(() => count() * 2);

// Side effects
effect(() => {
  console.log('Count changed:', count());
});

// Update
count.set(5);
count.update(c => c + 1);
```

### HTTP Interceptors

```typescript
// interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

## Project-Specific Patterns

### MUST DO
- Standalone components (no NgModules)
- Signals for reactive state (`signal()`, `computed()`, `effect()`)
- `inject()` for dependency injection (not constructor injection)
- `input()` and `output()` signal functions (not `@Input`/`@Output` decorators)
- New control flow syntax (`@if`, `@for`, `@switch`)
- Spartan UI components from `libs/ui/` (not custom implementations)
- Tailwind CSS v4 utilities for styling
- CSS variables for brand colors (`var(--gcore-primary)`, `var(--primary)`)

### MUST NOT DO
- Use NgModules or constructor injection
- Use `@Input`/`@Output` decorators (use signal-based)
- Create custom components when Spartan UI has them
- Use custom SCSS when Tailwind utilities exist
- Use old Tailwind v3 syntax (`!flex` → use `flex!` instead)

### Theme Guidelines

**Landing Page** (dark theme):
- Background: `bg-[#0a0a0a]`
- Accent: `text-[#FF4C00]`
- Use `appScrollReveal` directive

**Dashboard/App** (light theme):
- Background: `bg-[var(--gcore-bg)]`
- Primary: `var(--gcore-primary)` (#FF4C00)
- Use Spartan UI components

## Context7 Lookup

```python
mcp__context7__get-library-docs(
    context7CompatibleLibraryID="/angular/angular/20.0.0",
    topic="signals components standalone",
    mode="code"
)
```

## Related Files

- `frontend/libs/ui/` - Spartan UI helm components
- `frontend/src/app/core/` - Services, guards, interceptors
- `frontend/src/app/features/` - Feature components
- `frontend/src/styles.scss` - Theme configuration
