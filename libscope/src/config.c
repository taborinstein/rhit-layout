#include "config.h"
#define INI_IMPLEMENTATION
#include "ini.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <switch.h>
#include <sys/stat.h>

ini_t *config_load(void) {
	FILE *f = fopen(CONFIG_PATH, "r");
	if (f != NULL) {
		fseek(f, 0, SEEK_END);
		int size = ftell(f);
		fseek(f, 0, SEEK_SET);
		char *data = (char *)malloc(size + 1);
		fread(data, 1, size, f);
		data[size] = 0;
		fclose(f);
		ini_t *out = ini_load(data, NULL);
		free(data);
		return out;
	} else {
		return NULL;
	}
}

void config_destroy(ini_t *ini) {
	ini_destroy(ini);
}

bool config_player_enabled(ini_t *ini, int idx) {
	int sect = ini_find_section(ini, "players", 0);
	if (sect == INI_NOT_FOUND) {
		sect = ini_section_add(ini, "players", 0);
	}
	char prop[] = "1";
	prop[0] += idx;
	int prop_num = ini_find_property(ini, sect, prop, 0);
	if (prop_num == INI_NOT_FOUND) {
		return false;
	}
	return strstr(ini_property_value(ini, sect, prop_num), "true") != NULL;
}

void config_enable_player(ini_t *ini, int idx, bool enable) {
	int sect = ini_find_section(ini, "players", 0);
	if (sect == INI_NOT_FOUND) {
		sect = ini_section_add(ini, "players", 0);
	}
	char prop[] = "1";
	prop[0] += idx;
	int prop_num = ini_find_property(ini, sect, prop, 0);
	if (prop_num == INI_NOT_FOUND) {
		ini_property_add(ini, sect, prop, 0, enable ? "true" : "false", 0);
	} else {
		ini_property_value_set(ini, sect, prop_num, enable ? "true" : "false", 0);
	}
}

bool config_multicap_enabled(ini_t *ini) {
	int sect = ini_find_section(ini, "config", 0);
	if (sect == INI_NOT_FOUND) {
		sect = ini_section_add(ini, "config", 0);
	}
	int prop_num = ini_find_property(ini, sect, "multi_controller", 0);
	if (prop_num == INI_NOT_FOUND) {
		ini_property_add(ini, sect, "multi_controller", 0, "false", 0);
		return false;
	} else {
		return strstr(ini_property_value(ini, sect, prop_num), "true") != NULL;
	}
}

void config_enable_multicap(ini_t *ini, bool enable) {
	int sect = ini_find_section(ini, "config", 0);
	if (sect == INI_NOT_FOUND) {
		sect = ini_section_add(ini, "config", 0);
	}
	int prop_num = ini_find_property(ini, sect, "multi_controller", 0);
	if (prop_num == INI_NOT_FOUND) {
		ini_property_add(ini, sect, "multi_controller", 0, enable ? "true" : "false", 0);
	} else {
		ini_property_value_set(ini, sect, prop_num, enable ? "true" : "false", 0);
	}
}

void config_save(ini_t *ini) {
	int size = ini_save(ini, NULL, 0);
	char *data = (char *)malloc(size);
	size = ini_save(ini, data, size);

	struct stat st = {0};
	if (stat(CONFIG_DIR, &st) == -1) {
		mkdir(CONFIG_DIR, 0700);
	}

	FILE *f = fopen(CONFIG_PATH, "w");
	if (f != NULL) {
		fwrite(data, 1, size - 1, f);
		fclose(f);
	}
	free(data);
}

ini_t *config_create(void) {
	return ini_create(NULL);
}
