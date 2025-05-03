declare module 'modesl' {
  export class Connection {
    constructor(host: string, port: number, password: string);
    
    events(format: string, events: string): void;
    api(command: string, callback?: (res: any) => void): void;
    bgapi(command: string, callback?: (res: any) => void): void;
    execute(app: string, arg: string, uuid?: string): void;
    
    on(event: string, callback: (event: any) => void): void;
    
    // Add more methods as needed
  }
}