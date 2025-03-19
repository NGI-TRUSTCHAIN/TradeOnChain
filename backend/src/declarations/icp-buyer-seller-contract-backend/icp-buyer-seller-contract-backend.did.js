export const idlFactory = ({ IDL }) => {
  const ApiError = IDL.Record({ 'code' : IDL.Nat16, 'message' : IDL.Text });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : ApiError });
  const Role = IDL.Variant({ 'Admin' : IDL.Null, 'FrontendServer' : IDL.Null });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : ApiError });
  const ContractSignatories = IDL.Record({
    'seller' : IDL.Tuple(IDL.Principal, IDL.Bool),
    'buyer' : IDL.Tuple(IDL.Principal, IDL.Bool),
  });
  const Contract = IDL.Record({
    'contract_json' : IDL.Text,
    'issued_payment' : IDL.Bool,
    'created_at' : IDL.Nat64,
    'signatories' : ContractSignatories,
  });
  const User = IDL.Record({ 'role' : Role });
  const Result_2 = IDL.Variant({ 'Ok' : IDL.Bool, 'Err' : ApiError });
  return IDL.Service({
    '_sign_contract' : IDL.Func([IDL.Text], [Result], []),
    'add_permission' : IDL.Func([IDL.Principal, Role], [Result], []),
    'create_contract' : IDL.Func(
        [IDL.Text, IDL.Principal, IDL.Principal],
        [IDL.Text],
        [],
      ),
    'get_address' : IDL.Func([], [Result_1], []),
    'get_balance' : IDL.Func([], [Result_1], []),
    'get_balance_usdc' : IDL.Func([], [Result_1], []),
    'get_contract' : IDL.Func([IDL.Text], [IDL.Opt(Contract)], ['query']),
    'get_principal' : IDL.Func([], [IDL.Principal], ['query']),
    'get_users' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, User))],
        ['query'],
      ),
    'is_signed' : IDL.Func([IDL.Text], [Result_2], ['query']),
    'issue_payment' : IDL.Func([IDL.Text, IDL.Text, IDL.Nat64], [Result], []),
    'remove_permission' : IDL.Func([IDL.Principal], [Result], []),
    'sign_contract' : IDL.Func([IDL.Text], [Result], []),
    'update_permission' : IDL.Func([IDL.Principal, Role], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
