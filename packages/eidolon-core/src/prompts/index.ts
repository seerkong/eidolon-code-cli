import {filePathToText} from '../helper/FsHelper'

import rootSystemPromptImport from "./RootSystemPrompt.md";
import xnlDataFormatPromptImport from "./XnlDataFormatForAi.md";
import xnlToolcallSpecPromptImport from "./XnlToolcallSpec.md";
import todoReminderImport from "./TodoReminder.md";



export const rootSystemPrompt = filePathToText(rootSystemPromptImport);
export const xnlDataFormatPrompt = filePathToText(xnlDataFormatPromptImport);
export const xnlToolcallSpecPrompt = filePathToText(xnlToolcallSpecPromptImport);
export const todoReminder = filePathToText(todoReminderImport);
