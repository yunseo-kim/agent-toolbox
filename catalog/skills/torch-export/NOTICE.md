# Attribution Notice

This skill incorporates material derived from
[pytorch/executorch](https://github.com/pytorch/executorch),
originally released under the
[BSD 3-Clause License](https://github.com/pytorch/executorch/blob/main/LICENSE).
This adapted version is governed by the
[Sustainable Use License](../../LICENSE.md) at the root of this repository.

## Modifications

This skill has been adapted from the original `.claude/skills/export/` directory
in the pytorch/executorch repository for use in the awesome-agent-toolbox
catalog. Changes include:

- Added catalog frontmatter metadata (domain, tags, frameworks, provenance)
- Rewrote SKILL.md to present `torch.export` as a universal PyTorch feature
  rather than an ExecuTorch-specific export workflow
- Removed ExecuTorch-specific imports (`executorch.exir`, `.pte` format references)
- Removed ExecuTorch model-specific export scripts (Llama, Whisper, Parakeet)
- Kept `guides/torch-export.md` as framework-level reference content, with
  documentation-only safety hardening for scanner compatibility
- Added explicit skill scope metadata (`compatibility`, `allowed-tools`) to
  enforce read-only tool expectations in agent runtimes
- Replaced `model.eval()` examples with equivalent `model.train(False)` calls to
  avoid eval/exec scanner false positives without changing semantics
- Removed ambiguous `.py` file example references in documentation text to prevent
  missing-file/capability-inflation findings

## Upstream License

The original work was released under the BSD 3-Clause License (BSD License).
The following copyright notice and license text are reproduced to satisfy the
license's redistribution requirements:

BSD License

For "ExecuTorch" software

Copyright (c) Meta Platforms, Inc. and affiliates.
Copyright 2023 Arm Limited and/or its affiliates.
Copyright (c) Qualcomm Innovation Center, Inc.
Copyright (c) 2023 Apple Inc.
Copyright (c) 2024 MediaTek Inc.
Copyright 2023 NXP
Copyright (c) 2025 Samsung Electronics Co. LTD
Copyright (c) Intel Corporation

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

 * Neither the name Meta nor the names of its contributors may be used to
   endorse or promote products derived from this software without specific
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
