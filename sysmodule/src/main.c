#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <switch.h>

#include "server.h"
#include "service.h"

#include "config.h"
#include "ini.h"
#include "switch/runtime/pad.h"

#define INNER_HEAP_SIZE 0x80000

u32 __nx_applet_type = AppletType_None;
u32 __nx_fs_num_sessions = 1;
void __libnx_initheap(void) {
	static u8 inner_heap[INNER_HEAP_SIZE];
	extern void *fake_heap_start;
	extern void *fake_heap_end;

	// Configure the newlib heap.
	fake_heap_start = inner_heap;
	fake_heap_end = inner_heap + sizeof(inner_heap);
}

// Service initialization.
void __appInit(void) {
	Result rc;

	// Open a service manager session.
	rc = smInitialize();
	if (R_FAILED(rc))
		diagAbortWithResult(MAKERESULT(Module_Libnx, LibnxError_InitFail_SM));

	// Retrieve the current version of Horizon OS.
	rc = setsysInitialize();
	if (R_SUCCEEDED(rc)) {
		SetSysFirmwareVersion fw;
		rc = setsysGetFirmwareVersion(&fw);
		if (R_SUCCEEDED(rc))
			hosversionSet(MAKEHOSVERSION(fw.major, fw.minor, fw.micro));
		setsysExit();
	}
	rc = hidInitialize();
	if (R_FAILED(rc))
		diagAbortWithResult(MAKERESULT(Module_Libnx, LibnxError_InitFail_HID));

	rc = fsInitialize();
	if (R_FAILED(rc))
		diagAbortWithResult(MAKERESULT(Module_Libnx, LibnxError_InitFail_FS));

	fsdevMountSdmc();
	service_scope_init();
	nifmInitialize(NifmServiceType_User);
	static const SocketInitConfig socketInitConfig = {
	    // .bsdsockets_version = 1,
	    .tcp_tx_buf_size = 1024,
	    .tcp_rx_buf_size = 256,
	    .tcp_tx_buf_max_size = 0,
	    .tcp_rx_buf_max_size = 0,
	    .udp_tx_buf_size = 0x2400,
	    .udp_rx_buf_size = 0xA500,
	    .sb_efficiency = 4,
	    .num_bsd_sessions = 3,
	    .bsd_service_type = BsdServiceType_User,
	};
	socketInitialize(&socketInitConfig);
}

void __appExit(void) {
	socketExit();
	service_scope_exit();
	nifmExit();
	fsdevUnmountAll();
	fsExit();
	hidExit();
	smExit();
}

int main(int argc, char *argv[]) {
	ini_t *config = config_load();

	padConfigureInput(8, HidNpadStyleSet_NpadStandard | HidNpadStyleTag_NpadGc);
	// padConfigureInput(8, HidNpadStyleTag_NpadGc);
	PadState pads[8];
	HidAnalogStickState l, r;

	volatile rt_config rt_conf = {0};
	rt_conf.multicap = config_multicap_enabled(config);
    // padInitializeAny()
	for (int i = 0; i < 8; i++) {
		padInitialize(&pads[i], i);
		rt_conf.pads_enabled[i] = config_player_enabled(config, i);
	}

	Thread t;
	threadCreate(&t, service_scope_func, (void *)&rt_conf, NULL, 0x1000, 0x20, -2);
	threadStart(&t);

	server_setup();

	char client_msg[10];
	int client_len;
	char payload[810] = {'[', 0};
	int payload_len = 1;
	u64 down;
	u32 to_send;

	while (true) {
		if (accept_conn() < 0) {
			server_takedown();
			server_setup();
			continue;
		}

		while (true) {
			if ((client_len = read_msg(client_msg, 10)) < 0) {
				break;
			}

	padConfigureInput(8, HidNpadStyleSet_NpadStandard | HidNpadStyleTag_NpadGc);
			for (int i = 0; i < 8; i++) {
				if (rt_conf.pads_enabled[i]) {

                    padUpdate(&pads[i]);
                    
					down = padGetButtons(&pads[i]);
					l = padGetStickPos(&pads[i], 0);
					r = padGetStickPos(&pads[i], 1);

                    u32 gcr = pads[i].gc_triggers[1];
                    u32 gcl = pads[i].gc_triggers[0];
					to_send = (u32)down & 0xF00FFFF;
					payload_len += build_payload(i, to_send, l, r, gcl, gcr, &payload[payload_len]);
					if (!rt_conf.multicap) {
						break;
					}
				}
			}

			if (payload_len > 1) {
				payload[payload_len - 1] = ']';
				int ret = send_msg(payload, payload_len);
				memset(&payload[1], 0, sizeof(payload) - 1);
				payload_len = 1;
				if (ret < 0) {
					break;
				}
			}
		}
	}
	return 0;
}
