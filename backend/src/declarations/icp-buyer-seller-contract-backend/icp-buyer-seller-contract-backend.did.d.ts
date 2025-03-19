import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface ApiError { 'code' : number, 'message' : string }
export interface Contract {
  'contract_json' : string,
  'issued_payment' : boolean,
  'created_at' : bigint,
  'signatories' : ContractSignatories,
}
export interface ContractSignatories {
  'seller' : [Principal, boolean],
  'buyer' : [Principal, boolean],
}
export type Result = { 'Ok' : null } |
  { 'Err' : ApiError };
export type Result_1 = { 'Ok' : string } |
  { 'Err' : ApiError };
export type Result_2 = { 'Ok' : boolean } |
  { 'Err' : ApiError };
export type Role = { 'Admin' : null } |
  { 'FrontendServer' : null };
export interface User { 'role' : Role }
export interface _SERVICE {
  '_sign_contract' : ActorMethod<[string], Result>,
  'add_permission' : ActorMethod<[Principal, Role], Result>,
  'create_contract' : ActorMethod<[string, Principal, Principal], string>,
  'get_address' : ActorMethod<[], Result_1>,
  'get_balance' : ActorMethod<[], Result_1>,
  'get_balance_usdc' : ActorMethod<[], Result_1>,
  'get_contract' : ActorMethod<[string], [] | [Contract]>,
  'get_principal' : ActorMethod<[], Principal>,
  'get_users' : ActorMethod<[], Array<[Principal, User]>>,
  'is_signed' : ActorMethod<[string], Result_2>,
  'issue_payment' : ActorMethod<[string, string, bigint], Result>,
  'remove_permission' : ActorMethod<[Principal], Result>,
  'sign_contract' : ActorMethod<[string], Result>,
  'update_permission' : ActorMethod<[Principal, Role], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
