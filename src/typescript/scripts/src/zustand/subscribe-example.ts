import { enableMapSet } from "immer";
import { sleep } from "node_modules/@econia-labs/emojicoin-sdk/src/utils";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

type MyStore = {
  insert: (addr: `0x${string}`) => void;
  push: (addr: `0x${string}`, ...numbers: number[]) => void;
  users: Readonly<Map<`0x${string}`, Readonly<number[]>>>;
  arr: Readonly<number[]>;
  test: boolean;
  toggle: () => void;
};

enableMapSet();

const useMyStore = () =>
  createStore<MyStore>()(
    subscribeWithSelector(
      immer((set, get) => ({
        toggle: () => {
          set((state) => {
            state.test = !state.test;
          });
        },
        test: false,
        users: new Map(),
        arr: [],
        insert(user) {
          if (!get().users.get(user)) {
            set((state) => {
              state.users.set(user, []);
            });
          }
        },
        push(userIn, numbers) {
          set((state) => {
            if (!state.users.has(userIn)) {
              state.users.set(userIn, []);
            }
            const user = state.users.get(userIn);
            if (user) {
              user.push(numbers);
            }
          });
        },
      }))
    )
  );

const myStore = useMyStore();

myStore.subscribe(
  (s) => s.test,
  (n) => console.log(n)
);
myStore.subscribe(
  (s) => s.arr,
  (n) => console.log(n)
);
myStore.subscribe(
  (s) => s.users,
  (n) => console.log(n)
);
async function main() {
  let i = 0;
  do {
    myStore.getState().push("0xme", i++);
    myStore.getState().toggle();
    await sleep(100);
    if (i > 10) {
      break;
    }
  } while (true);
}

main();
