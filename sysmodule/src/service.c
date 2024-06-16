#include "service.h"
#include "ipc.h"
#include "ipc_server.h"
#include "server.h"

IpcServer server;

void service_scope_init(void) {
	ipcServerInit(&server, "scope", 2);
}

void service_scope_exit(void) {
	ipcServerExit(&server);
}

bool is_running = true;

void service_scope_stop(void) {
	is_running = false;
}

Result service_handler(void *arg, const IpcServerRequest *r, u8 *out_data, size_t *out_size) {
	rt_config *conf = (rt_config *)arg;
	switch (r->data.cmdId) {
		case SC_GETVER:
			*out_size = sizeof(int);
			*(int *)out_data = IPCVER;
			break;
		case SC_GETIP:
			*out_size = sizeof(int);
			*(int *)out_data = server_ip();
			break;
		case SC_ENABLECONTROLLER:
			if (r->data.size >= sizeof(int)) {
				conf->pads_enabled[*(int *)r->data.ptr] = true;
			}
			break;
		case SC_DISABLECONTROLLER:
			if (r->data.size >= sizeof(int)) {
				conf->pads_enabled[*(int *)r->data.ptr] = false;
			}
			break;
		case SC_SETMULTICAP:
			if (r->data.size >= sizeof(bool)) {
				conf->multicap = *(bool *)r->data.ptr;
			}
			break;
	}
	return 0; // idfk
}

void service_scope_func(void *rt_conf) {
	while (is_running) {
		if (ipcServerProcess(&server, service_handler, rt_conf) == KERNELRESULT(Cancelled)) {
			break;
		}
	}
}
