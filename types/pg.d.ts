/* eslint-disable @typescript-eslint/unified-signatures */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/method-signature-style */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'pg' {
  import events from 'events';
  import type stream from 'stream';
  import {
    type ConnectionOptions,
  } from 'tls';
  import {
    type NoticeMessage,
  } from 'pg-protocol/dist/messages';
  import type pgTypes from 'pg-types';

  export type ClientConfig = {
    application_name?: string | undefined,
    connectionString?: string | undefined,
    connectionTimeoutMillis?: number | undefined,
    database?: string | undefined,
    host?: string | undefined,
    idle_in_transaction_session_timeout?: number | undefined,
    keepAlive?: boolean | undefined,
    keepAliveInitialDelayMillis?: number | undefined,
    parseInputDatesAsUTC?: boolean | undefined,
    password?: string | (() => Promise<string> | string) | undefined,
    port?: number | undefined,
    query_timeout?: number | undefined,
    ssl?: ConnectionOptions | boolean | undefined,
    statement_timeout?: number | false | undefined,
    stream?: stream.Duplex | undefined,
    types?: CustomTypesConfig | undefined,
    user?: string | undefined,
  };

  export type ConnectionConfig = ClientConfig;

  export type Defaults = ClientConfig & {
    binary?: boolean | undefined,
    parseInt8?: boolean | undefined,
    poolIdleTimeout?: number | undefined,
    poolSize?: number | undefined,
    reapIntervalMillis?: number | undefined,
  };

  export type PoolConfig = ClientConfig & {
    Promise?: PromiseConstructorLike | undefined,
    idleTimeoutMillis?: number | undefined,
    log?: ((...messages: any[]) => void) | undefined,
    // properties from module 'node-pool'
    max?: number | undefined,
    min?: number | undefined,
  };

  export type QueryConfig<I extends any[] = any[]> = {
    name?: string | undefined,
    text: string,
    types?: CustomTypesConfig | undefined,
    values?: I | undefined,
  };

  export type CustomTypesConfig = {
    getTypeParser: typeof pgTypes.getTypeParser,
  };

  export type Submittable = {
    submit: (connection: Connection) => void,
  };

  export type QueryArrayConfig<I extends any[] = any[]> = QueryConfig<I> & {
    rowMode: 'array',
  };

  export type FieldDef = {
    columnID: number,
    dataTypeID: number,
    dataTypeModifier: number,
    dataTypeSize: number,
    format: string,
    name: string,
    tableID: number,
  };

  export type QueryResultBase = {
    command: string,
    fields: FieldDef[],
    oid: number,
    rowCount: number,
  };

  export type QueryResultRow = {
    [column: string]: any,
  };

  export type QueryResult<R extends QueryResultRow = any> = QueryResultBase & {
    rows: R[],
  };

  export type QueryArrayResult<R extends any[] = any[]> = QueryResultBase & {
    rows: R[],
  };

  export type Notification = {
    channel: string,
    payload?: string | undefined,
    processId: number,
  };

  export type ResultBuilder<R extends QueryResultRow = any> = QueryResult<R> & {
    addRow(row: R): void,
  };

  export type QueryParse = {
    name: string,
    text: string,
    types: string[],
  };

  export type BindConfig = {
    binary?: string | undefined,
    portal?: string | undefined,
    statement?: string | undefined,
    values?: Array<Buffer | string | null | undefined> | undefined,
  };

  export type ExecuteConfig = {
    portal?: string | undefined,
    rows?: string | undefined,
  };

  export type MessageConfig = {
    name?: string | undefined,
    type: string,
  };

  export class Connection extends events.EventEmitter {
    readonly stream: stream.Duplex;

    constructor (config?: ConnectionConfig);

    bind (config: BindConfig | null, more: boolean): void;
    execute (config: ExecuteConfig | null, more: boolean): void;
    parse (query: QueryParse, more: boolean): void;

    query (text: string): void;

    describe (msg: MessageConfig, more: boolean): void;
    close (msg: MessageConfig, more: boolean): void;

    flush (): void;
    sync (): void;
    end (): void;
  }

  /**
   * {@link https://node-postgres.com/api/pool}
   */
  export class Pool extends events.EventEmitter {
    /**
     * Every field of the config object is entirely optional.
     * The config passed to the pool is also passed to every client
     * instance within the pool when the pool creates that client.
     */
    constructor (config?: PoolConfig);

    readonly totalCount: number;

    readonly idleCount: number;

    readonly waitingCount: number;

    connect (): Promise<PoolClient>;
    connect (callback: (err: Error, client: PoolClient, done: (release?: any) => void) => void): void;

    end (): Promise<void>;
    end (callback: () => void): void;

    query<T extends Submittable>(queryStream: T): T;
    query<R extends any[] = any[], I extends any[] = any[]>(
      queryConfig: QueryArrayConfig<I>,
      values?: I,
    ): Promise<QueryArrayResult<R>>;
    query<R extends QueryResultRow = any, I extends any[] = any[]>(
      queryConfig: QueryConfig<I>,
    ): Promise<QueryResult<R>>;
    query<R extends QueryResultRow = any, I extends any[] = any[]>(
      queryTextOrConfig: QueryConfig<I> | string,
      values?: I,
    ): Promise<QueryResult<R>>;
    query<R extends any[] = any[], I extends any[] = any[]>(
      queryConfig: QueryArrayConfig<I>,
      callback: (err: Error, result: QueryArrayResult<R>) => void,
    ): void;
    query<R extends QueryResultRow = any, I extends any[] = any[]>(
      queryTextOrConfig: QueryConfig<I> | string,
      callback: (err: Error, result: QueryResult<R>) => void,
    ): void;
    query<R extends QueryResultRow = any, I extends any[] = any[]>(
      queryText: string,
      values: I,
      callback: (err: Error, result: QueryResult<R>) => void,
    ): void;

    on (event: 'error', listener: (err: Error, client: PoolClient) => void): this;
    on (event: 'acquire' | 'connect' | 'remove', listener: (client: PoolClient) => void): this;

    public _pulseQueue (): void;
    public _remove (client: PoolClient): void;

    public _clients: PoolClient[];
  }

  export class ClientBase extends events.EventEmitter {
    constructor (config?: ClientConfig | string);

    connect (): Promise<void>;
    connect (callback: (err: Error) => void): void;

    query<T extends Submittable>(queryStream: T): T;
    query<R extends any[] = any[], I extends any[] = any[]>(
      queryConfig: QueryArrayConfig<I>,
      values?: I,
    ): Promise<QueryArrayResult<R>>;
    query<R extends QueryResultRow = any, I extends any[] = any[]>(
      queryConfig: QueryConfig<I>,
    ): Promise<QueryResult<R>>;
    query<R extends QueryResultRow = any, I extends any[] = any[]>(
      queryTextOrConfig: QueryConfig<I> | string,
      values?: I,
    ): Promise<QueryResult<R>>;
    query<R extends any[] = any[], I extends any[] = any[]>(
      queryConfig: QueryArrayConfig<I>,
      callback: (err: Error, result: QueryArrayResult<R>) => void,
    ): void;
    query<R extends QueryResultRow = any, I extends any[] = any[]>(
      queryTextOrConfig: QueryConfig<I> | string,
      callback: (err: Error, result: QueryResult<R>) => void,
    ): void;
    query<R extends QueryResultRow = any, I extends any[] = any[]>(
      queryText: string,
      values: any[],
      callback: (err: Error, result: QueryResult<R>) => void,
    ): void;

    copyFrom (queryText: string): stream.Writable;
    copyTo (queryText: string): stream.Readable;

    pauseDrain (): void;
    resumeDrain (): void;

    escapeIdentifier (str: string): string;
    escapeLiteral (str: string): string;

    on (event: 'drain', listener: () => void): this;
    on (event: 'end', listener: () => void): this;
    on (event: 'error', listener: (err: Error) => void): this;
    on (event: 'notice', listener: (notice: NoticeMessage) => void): this;
    on (event: 'notification', listener: (message: Notification) => void): this;

    public processID: number;

    public _types: {
      setTypeParser: (type: string, parser: (value: string) => unknown) => void,
    };
  }

  export class Client extends ClientBase {
    user?: string | undefined;

    database?: string | undefined;

    port: number;

    host: string;

    password?: string | undefined;

    ssl: boolean;

    constructor (config?: ClientConfig | string);

    end (): Promise<void>;
    end (callback: (err: Error) => void): void;
  }

  export type PoolClient = ClientBase & {
    release(err?: Error | boolean): void,
  };

  export class Query<R extends QueryResultRow = any, I extends any[] = any> extends events.EventEmitter
    implements Submittable {
    constructor (queryTextOrConfig?: QueryConfig<I> | string, values?: I);
    submit: (connection: Connection) => void;
    on (event: 'row', listener: (row: R, result?: ResultBuilder<R>) => void): this;
    on (event: 'error', listener: (err: Error) => void): this;
    on (event: 'end', listener: (result: ResultBuilder<R>) => void): this;
  }

  export class Events extends events.EventEmitter {
    on (event: 'error', listener: (err: Error, client: Client) => void): this;
  }

  export const types: typeof pgTypes;

  export const defaults: ClientConfig & Defaults;
}
