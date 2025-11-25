import { SkillDefinition } from "./types";
import * as bash from "./bash";
import * as read_file from "./read_file";
import * as write_file from "./write_file";
import * as edit_text from "./edit_text";
import * as todo_write from "./todo_write";
import { SkillRegistry } from "./registry";
import {filePathToText} from '../helper/FsHelper'

export function loadSkills(): { registry: SkillRegistry; prompts: string[] } {
  const skills: SkillDefinition[] = [
    {
      namespace: bash.namespace,
      name: bash.name,
      briefPrompt: filePathToText(bash.brief),
      detailPrompt: filePathToText(bash.detail),
      run: bash.handler,
    },
    {
      namespace: read_file.namespace,
      name: read_file.name,
      briefPrompt: filePathToText(read_file.brief),
      detailPrompt: filePathToText(read_file.detail),
      run: read_file.handler,
    },
    {
      namespace: write_file.namespace,
      name: write_file.name,
      briefPrompt: filePathToText(write_file.brief),
      detailPrompt: filePathToText(write_file.detail),
      run: write_file.handler,
    },
    {
      namespace: edit_text.namespace,
      name: edit_text.name,
      briefPrompt: filePathToText(edit_text.brief),
      detailPrompt: filePathToText(edit_text.detail),
      run: edit_text.handler,
    },
    {
      namespace: todo_write.namespace,
      name: todo_write.name,
      briefPrompt: filePathToText(todo_write.brief),
      detailPrompt: filePathToText(todo_write.detail),
      run: todo_write.handler,
    },
  ];
  const registry = new SkillRegistry(skills);
  const prompts = registry.getPrompts();
  return { registry, prompts };
}
