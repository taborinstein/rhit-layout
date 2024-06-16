#include "ipc.h"
#include <stdio.h>
#include <string.h>
#include <switch.h>

Service scope;

// much of this lifted from sys-clk
Result ipc_init(void) {
	if (serviceIsActive(&scope)) {
		return 0;
	}
	Result rc = smGetService(&scope, "scope");
	if (R_FAILED(rc)) {
		serviceClose(&scope);
	}
	return rc;
}

bool ipc_running(void) {
	Handle h;
	bool running = R_FAILED(smRegisterService(&h, smEncodeName("scope"), false, 1));
	if (!running) {
		smUnregisterService(smEncodeName("scope"));
	}
	return running;
}

int ipc_getver(void) {
	int ver = 0;
	serviceDispatchOut(&scope, SC_GETVER, ver);
	return ver;
}

char ipa[17];

char *ipc_getip(void) {
	unsigned char ip[4];
	memset(ipa, 0, 17);
	serviceDispatchOut(&scope, SC_GETIP, ip);
	snprintf(ipa, 16, "%d.%d.%d.%d", ip[0], ip[1], ip[2], ip[3]);
	return ipa;
}

void ipc_enablecontroller(int idx) {
	serviceDispatchIn(&scope, SC_ENABLECONTROLLER, idx);
}

void ipc_disablecontroller(int idx) {
	serviceDispatchIn(&scope, SC_DISABLECONTROLLER, idx);
}

void ipc_setmulticap(bool state) {
	serviceDispatchIn(&scope, SC_SETMULTICAP, state);
}

void ipc_exit(void) {
	serviceClose(&scope);
}
