import { CommandOptions, CommandResult, EditTextRequest, EditTextResult, FileReadOptions, FileReadResult, FileSystemApi, FileWriteResult, ListDirResult, WriteMode } from "@eidolon/fs-api";
export declare class LocalFileSystem implements FileSystemApi {
    root: string;
    constructor(root: string);
    resolvePath(path: string): string;
    readFile(path: string, options?: FileReadOptions): Promise<FileReadResult>;
    writeFile(path: string, content: string, mode?: WriteMode): Promise<FileWriteResult>;
    editText(path: string, edit: EditTextRequest): Promise<EditTextResult>;
    listDir(path?: string): Promise<ListDirResult>;
    runCommand(command: string, options?: CommandOptions): Promise<CommandResult>;
}
export declare function sanitizeProjectId(workspace: string): string;
