#ifndef IPC_H_
#define IPC_H_
#include <switch.h>

enum ScopeCmd {
	SC_ENABLECONTROLLER,
	SC_DISABLECONTROLLER,
	SC_SETMULTICAP,
	SC_GETIP,

	SC_GETVER = 1000,
};

#ifdef __cplusplus
extern "C" {
#endif

Result ipc_init(void);
bool ipc_running(void);
int ipc_getver(void);
char *ipc_getip(void);
void ipc_enablecontroller(int idx);
void ipc_disablecontroller(int idx);
void ipc_setmulticap(bool state);
void ipc_exit(void);
#ifdef __cplusplus
}
#endif

const int IPCVER = 1;

#endif // IPC_H_
