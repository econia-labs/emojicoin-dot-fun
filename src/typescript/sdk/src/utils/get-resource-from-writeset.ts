import {
  AccountAddress,
  type AccountAddressInput,
  parseTypeTag,
  type TypeTag,
  type UserTransactionResponse,
  type WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";

export function getResourceFromWriteSet<T, U>(args: {
  response: UserTransactionResponse;
  resourceTypeTag: TypeTag;
  writeResourceAddress: AccountAddressInput;
  convert: (data: T) => U;
}): U | undefined {
  const { writeResourceAddress, resourceTypeTag, response, convert } = args;
  const { changes } = response;
  const changedAddress = AccountAddress.from(writeResourceAddress);
  let resource: T | undefined;
  changes.find((someChange) => {
    if (someChange.type !== "write_resource") return false;
    const change = someChange as WriteSetChangeWriteResource;

    const { address } = change as WriteSetChangeWriteResource;
    if (!changedAddress.equals(AccountAddress.from(address))) return false;

    const resourceType = (change as WriteSetChangeWriteResource).data.type;
    const typeTag = parseTypeTag(resourceType).toString();
    if (typeTag !== resourceTypeTag.toString()) return false;

    resource = change.data.data as T;
    return true;
  });

  if (typeof resource !== "undefined") {
    return convert(resource);
  }
  return undefined;
}
