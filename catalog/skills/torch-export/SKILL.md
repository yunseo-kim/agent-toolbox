---
name: torch-export
description: "Export PyTorch models with torch.export -- dynamic shapes, symbolic tracing, control flow operators, debugging export failures, and making untraceable code traceable"
license: Sustainable Use License 1.0
compatibility: "Documentation-oriented skill. Requires Python with PyTorch for optional local examples; no network access or shell execution is required by the skill itself."
allowed-tools:
  - Read
  - Grep
  - Glob
metadata:
  domain: data-ai
  tags: "pytorch, torch-export, model-export, deep-learning, torchscript-replacement"
  frameworks: "pytorch"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-03-06"
  provenance: adapted
---

# torch.export

Capture a PyTorch `nn.Module` into an `ExportedProgram` -- a fully traced
ATen-dialect graph with no Python runtime dependency. This is the standard
entry point for deploying PyTorch models to any runtime (ExecuTorch,
TensorRT, ONNX, custom backends).

## Basic Export

```python
from torch.export import export

exported = export(model.train(False), (example_input,))
```

## Dynamic Shapes

By default every dimension is static. Use `dynamic_shapes` to allow variable
sizes at runtime:

```python
from torch.export import Dim, export

batch = Dim("batch", min=1, max=32)
seq_len = Dim("seq_len", min=1, max=2048)

exported = export(
    model.train(False),
    (example_input,),
    dynamic_shapes={"x": {0: batch, 1: seq_len}},
)
```

Rules:
- Keys match kwarg names or positional index
- Values map dimension indices to `Dim` objects
- Same `Dim` object across inputs asserts equal size
- `Dim.AUTO` for best-effort dynamic marking

## The ExportedProgram

```python
print(exported.graph)            # torch.fx.Graph -- the traced DAG
gm = exported.graph_module       # torch.fx.GraphModule wrapping the graph
out = exported.module()(x)       # run eagerly for correctness testing
```

### IR Levels

| IR | How | Op count |
|----|-----|----------|
| Training IR | `export()` (default) | ~3000 |
| Inference IR | `ep.run_decompositions(decomp_table={})` | ~2000 |
| Core ATen IR | `ep.run_decompositions(decomp_table=None)` | ~180 |

Most deployment backends use Core ATen IR.

### Serialization

```python
torch.export.save(exported, "model.pt2")
loaded = torch.export.load("model.pt2")
```

## Control Flow

- **Static**: branches on Python primitives are resolved at trace time
- **Shape-dependent**: branches on dynamic shapes emit guards (must be provable)
- **Data-dependent**: use `torch._check` to assert one branch, or `torch.cond` for both

Higher-order operators: `torch.cond`, `torch.while_loop`, `torch.map`,
`torch.scan`, `torch.associative_scan`

## Debugging Failures

- **Draft export**: `torch.export.draft_export(model, args)` -- always produces a graph, reports all issues
- **Verbose logs**: `TORCH_LOGS="+dynamo,+export" python -m your_export_module 2>&1 | tlparse`
- **Incremental**: test static shapes first, then add one dynamic dimension at a time
- **Auto-fix shape constraints**: `refine_dynamic_shapes_from_suggested_fixes(str(e), ds)`

## Reference

Load [guides/torch-export.md](guides/torch-export.md) when the user needs a deep dive on tracing internals, symbolic shapes, guards, control flow operators, common failure patterns, or making untraceable code traceable.
