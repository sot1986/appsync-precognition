import { runtime, util } from "@aws-appsync/utils";

//#region src/utils.ts
function isArray(value) {
	if (typeof value === "object" && !!value && Object.hasOwn(value, "length")) return typeof value.length === "number";
	return false;
}
function getNestedValue(obj, path) {
	return path.split(".").reduce((current, key) => util.matches("^d+$", key) ? current[Number(key)] : current[key], obj);
}
function setNestedValue(obj, path, value) {
	const keys = path.split(".");
	if (keys.length === 1) {
		obj[keys[0]] = value;
		return;
	}
	const lastKey = keys.pop();
	const parentObject = getNestedValue(obj, keys.join("."));
	if (typeof parentObject === "object" && !!parentObject) parentObject[lastKey] = value;
}
function getHeader(name, ctx) {
	return Object.entries(ctx.request.headers).reduce((prev, [key, value]) => typeof prev === "string" ? prev : key.toLowerCase() === name.toLowerCase() && typeof value === "string" ? value : null, null);
}
function isPrecognitiveRequest(ctx) {
	return getHeader("precognition", ctx) === "true";
}
function precognitiveKeys(ctx) {
	const keys = getHeader("Precognition-Validate-Only", ctx);
	return keys ? keys.split(",").map((key) => key.trim()) : null;
}
function cleanString(value, options) {
	if (options?.trim === false) return value;
	let parsed = value.trim();
	if (options?.allowEmptyString) return parsed;
	if (parsed === "") parsed = null;
	return parsed;
}

//#endregion
//#region src/rules.ts
function parse(value, rule) {
	const [name, ...params] = typeof rule === "string" ? [rule, void 0] : [rule[0], ...rule.slice(1)];
	switch (name) {
		case "required": return requiredRule(value);
		case "nullable": return nullableRule(value);
		case "sometimes": return sometimesRule(value);
		case "min": return minRule(value, params[0]);
		case "max": return maxRule(value, params[0]);
		case "between": return betweenRule(value, params[0], params[1]);
		case "email": return emailRule(value);
		case "url": return urlRule(value);
		case "uuid": return uuidRule(value);
		case "ulid": return ulidRule(value);
		case "regex": return regexRule(value, params[0]);
		case "in": return inRule(value, ...params);
		case "notIn": return notInRule(value, ...params);
		case "array": return arrayRule(value);
		case "object": return objectRule(value);
		case "boolean": return booleanRule(value);
		case "number": return numberRule(value);
		case "string": return stringRule(value);
		case "date": return dateRule(value);
		case "before": return beforeRule(value, params[0]);
		case "after": return afterRule(value, params[0]);
		case "beforeOrEqual": return beforeOrEqualRule(value, params[0]);
		case "afterOrEqual": return afterOrEqualRule(value, params[0]);
		default: return {
			check: false,
			message: `Unknown rule ${name}`,
			value
		};
	}
}
function minRule(value, minValue) {
	const result = {
		check: false,
		message: `:attribute must be greater than or equal to ${minValue}`,
		value
	};
	if (typeof value === "number") result.check = value >= minValue;
	if (typeof value === "string") result.check = value.length >= minValue;
	if (isArray(value)) {
		result.check = value.length >= minValue;
		result.message = `Array must contain at least ${minValue} elements`;
	}
	return result;
}
function maxRule(value, maxValue) {
	const result = {
		check: false,
		message: `:attribute must be less than or equal to ${maxValue}`,
		value
	};
	if (typeof value === "number") result.check = value <= maxValue;
	if (typeof value === "string") {
		result.check = value.length <= maxValue;
		result.message = `String must contain at most ${maxValue} characters`;
	}
	if (isArray(value)) {
		result.check = value.length <= maxValue;
		result.message = `Array must contain at most ${maxValue} elements`;
	}
	return result;
}
function betweenRule(value, minValue, maxValue) {
	const result = {
		check: false,
		message: `:attribute must be between ${minValue} and ${maxValue}`,
		value
	};
	if (typeof value === "number") result.check = value >= minValue && value <= maxValue;
	if (typeof value === "string") {
		result.check = value.length >= minValue && value.length <= maxValue;
		result.message = `String must contain between ${minValue} and ${maxValue} characters`;
	}
	if (isArray(value)) {
		result.check = value.length >= minValue && value.length <= maxValue;
		result.message = `Array must contain between ${minValue} and ${maxValue} elements`;
	}
	return result;
}
function emailRule(value) {
	const result = {
		check: false,
		message: ":attribute must be a valid email address",
		value
	};
	if (typeof value === "string") result.check = util.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", result.value);
	return result;
}
function urlRule(value) {
	const result = {
		check: false,
		message: ":attribute must be a valid URL",
		value
	};
	if (typeof value === "string") result.check = util.matches("^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$|^https?:\\/\\/(localhost|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})(:\\d+)?(\\/.*)?$", result.value);
	return result;
}
function uuidRule(value) {
	const result = {
		check: false,
		message: ":attribute must be a valid UUID",
		value
	};
	if (typeof value === "string") result.check = util.matches("^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", value);
	return result;
}
function ulidRule(value) {
	const result = {
		check: false,
		message: ":attribute must be a valid ULID",
		value
	};
	if (typeof value === "string") result.check = util.matches("^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$", value);
	return result;
}
function regexRule(value, pattern) {
	const result = {
		check: false,
		message: ":attribute must match the specified regular expression",
		value
	};
	if (typeof value === "string") {
		result.value = value.trim();
		result.check = util.matches(pattern, result.value);
	}
	return result;
}
function inRule(value, ...params) {
	return {
		check: params.includes(value),
		message: ":attribute must be one of the specified values",
		value
	};
}
function notInRule(value, ...params) {
	return {
		check: !params.includes(value),
		message: ":attribute must not be one of the specified values",
		value
	};
}
function requiredRule(value) {
	const result = {
		check: true,
		message: ":attribute is required",
		value
	};
	if (typeof value === "string") result.check = value.length > 0;
	if (isArray(value)) result.check = value.length > 0;
	if (typeof value === "number") result.check = true;
	if (typeof value === "boolean") result.check = true;
	if (typeof value === "object" && !result.value) {
		result.message = ":attribute is not nullable";
		result.check = false;
	}
	if (typeof value === "undefined") result.check = false;
	return result;
}
function nullableRule(value) {
	return {
		check: true,
		message: "",
		value
	};
}
function sometimesRule(value) {
	const result = {
		check: true,
		message: "",
		value
	};
	if (typeof value === "undefined") return result;
	if (typeof value === "object" && !result.value) {
		result.message = ":attribute is not nullable";
		result.check = false;
	}
	return requiredRule(value);
}
function arrayRule(value) {
	const result = {
		check: false,
		message: ":attribute must be an array",
		value
	};
	if (isArray(value)) result.check = true;
	return result;
}
function objectRule(value) {
	const result = {
		check: false,
		message: ":attribute must be an object",
		value
	};
	if (typeof value === "object" && !isArray(result.value)) result.check = true;
	return result;
}
function booleanRule(value) {
	const result = {
		check: false,
		message: ":attribute must be a boolean",
		value
	};
	if (typeof value === "boolean") result.check = true;
	return result;
}
function numberRule(value) {
	const result = {
		check: false,
		message: ":attribute must be a number",
		value
	};
	if (typeof value === "number") result.check = true;
	return result;
}
function stringRule(value) {
	const result = {
		check: false,
		message: ":attribute must be a string",
		value
	};
	if (typeof value === "string") result.check = true;
	return result;
}
function dateRule(value) {
	const result = {
		check: false,
		message: ":attribute must be a date",
		value
	};
	if (typeof value === "string") result.check = util.matches("^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])T([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(\\.\\d{1,6})?Z$", result.value);
	if (typeof value === "number") result.check = true;
	return result;
}
function beforeRule(value, start) {
	const result = {
		check: false,
		message: `:attribute must be before ${start}`,
		value
	};
	const startValue = util.time.parseISO8601ToEpochMilliSeconds(start);
	if (typeof value === "string") result.check = util.time.parseISO8601ToEpochMilliSeconds(value) < startValue;
	if (typeof value === "number") result.check = value < startValue;
	return result;
}
function afterRule(value, start) {
	const result = {
		check: false,
		message: `:attribute must be after ${start}`,
		value
	};
	const startValue = util.time.parseISO8601ToEpochMilliSeconds(start);
	if (typeof value === "string") result.check = util.time.parseISO8601ToEpochMilliSeconds(value) > startValue;
	if (typeof value === "number") result.check = value > startValue;
	return result;
}
function beforeOrEqualRule(value, start) {
	const result = {
		check: false,
		message: `:attribute must be before or equal to ${start}`,
		value
	};
	const startValue = util.time.parseISO8601ToEpochMilliSeconds(start);
	if (typeof value === "string") result.check = util.time.parseISO8601ToEpochMilliSeconds(value) <= startValue;
	if (typeof value === "number") result.check = value <= startValue;
	return result;
}
function afterOrEqualRule(value, start) {
	const result = {
		check: false,
		message: `:attribute must be after or equal to ${start}`,
		value
	};
	const startValue = util.time.parseISO8601ToEpochMilliSeconds(start);
	if (typeof value === "string") result.check = util.time.parseISO8601ToEpochMilliSeconds(value) >= startValue;
	if (typeof value === "number") result.check = value >= startValue;
	return result;
}

//#endregion
//#region src/index.ts
function validate(obj, checks, options) {
	let error = {};
	Object.keys(checks).forEach((path) => {
		let value = getNestedValue(obj, path);
		if (typeof value === "string") {
			value = cleanString(value, options);
			setNestedValue(obj, path, value);
		}
		let skip = false;
		checks[path]?.forEach((rule) => {
			if (skip) return;
			if (rule === "nullable" && value === null) skip = true;
			if (rule === "sometimes" && typeof value === "undefined") skip = true;
			const result = typeof rule === "string" || isArray(rule) ? parse(value, rule) : { ...rule };
			if (result.check) return;
			if (error.msg) util.appendError(error.msg, error.errorType, error.data, error.errorInfo);
			result.message = result.message.replace(":attribute", formatAttributeName(path));
			error = {
				msg: result.message,
				errorType: "ValidationError",
				data: null,
				errorInfo: {
					path,
					value
				}
			};
			skip = true;
		});
	});
	if (!error.msg) return obj;
	util.error(error.msg, error.errorType, error.data, error.errorInfo);
}
function precognitiveValidation(ctx, checks, options) {
	if (!isPrecognitiveRequest(ctx)) return validate(ctx.args, checks, options);
	const validationKeys = precognitiveKeys(ctx);
	util.http.addResponseHeader("Precognition", "true");
	if (!validationKeys) {
		validate(ctx.args, checks, options);
		util.http.addResponseHeader("Precognition-Success", "true");
		runtime.earlyReturn(null);
	}
	util.http.addResponseHeader("Precognition-Validate-Only", validationKeys.join(","));
	const precognitionChecks = {};
	validationKeys.forEach((key) => {
		precognitionChecks[key] = checks[key];
	});
	validate(ctx.args, precognitionChecks, options);
	util.http.addResponseHeader("Precognition-Success", "true");
	runtime.earlyReturn(null, { skipTo: options?.skipTo ?? "END" });
}
function formatAttributeName(path) {
	return path.split(".").reduce((acc, part) => {
		if (util.matches("^d+$", part)) return acc;
		return acc ? `${acc} ${part.toLowerCase()}` : part.toLowerCase();
	}, "");
}

//#endregion
export { formatAttributeName, precognitiveValidation, validate };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJuYW1lcyI6WyJwYXJzZWQ6IHN0cmluZyB8IG51bGwiLCJyZXN1bHQ6IFJ1bGU8VD4iLCJlcnJvcjogeyBtc2c/OiBzdHJpbmcsIGVycm9yVHlwZT86IHN0cmluZywgZGF0YT86IGFueSwgZXJyb3JJbmZvPzogYW55IH0iLCJydWxlcy5wYXJzZSJdLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy50cyIsIi4uL3NyYy9ydWxlcy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IENvbnRleHQgfSBmcm9tICdAYXdzLWFwcHN5bmMvdXRpbHMnXG5pbXBvcnQgdHlwZSB7IE5lc3RlZEtleU9mIH0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB7IHV0aWwgfSBmcm9tICdAYXdzLWFwcHN5bmMvdXRpbHMnXG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0cmluZyh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIHN0cmluZyB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0FycmF5KHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgdW5rbm93bltdIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgISF2YWx1ZSAmJiBPYmplY3QuaGFzT3duKHZhbHVlLCAnbGVuZ3RoJykpIHtcbiAgICByZXR1cm4gdHlwZW9mICh2YWx1ZSBhcyB1bmtub3duW10pLmxlbmd0aCA9PT0gJ251bWJlcidcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5lc3RlZFZhbHVlPFQgZXh0ZW5kcyBvYmplY3Q+KG9iajogVCwgcGF0aDogTmVzdGVkS2V5T2Y8VD4pOiBhbnkge1xuICByZXR1cm4gcGF0aC5zcGxpdCgnLicpLnJlZHVjZTx1bmtub3duPigoY3VycmVudCwga2V5KSA9PiB1dGlsLm1hdGNoZXMoJ15cXGQrJCcsIGtleSlcbiAgICA/IChjdXJyZW50IGFzIHVua25vd25bXSlbTnVtYmVyKGtleSldXG4gICAgOiAoY3VycmVudCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilba2V5XSwgb2JqKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TmVzdGVkVmFsdWU8VCBleHRlbmRzIG9iamVjdD4ob2JqOiBULCBwYXRoOiBOZXN0ZWRLZXlPZjxUPiwgdmFsdWU6IHVua25vd24pOiB2b2lkIHtcbiAgY29uc3Qga2V5cyA9IHBhdGguc3BsaXQoJy4nKVxuICBpZiAoa2V5cy5sZW5ndGggPT09IDEpIHtcbiAgICBvYmpba2V5c1swXSBhcyBrZXlvZiB0eXBlb2Ygb2JqXSA9IHZhbHVlIGFzIGFueVxuICAgIHJldHVyblxuICB9XG4gIGNvbnN0IGxhc3RLZXkgPSBrZXlzLnBvcCgpIGFzIHN0cmluZ1xuICBjb25zdCBwYXJlbnRPYmplY3QgPSBnZXROZXN0ZWRWYWx1ZShvYmosIGtleXMuam9pbignLicpIGFzIE5lc3RlZEtleU9mPFQ+KVxuICBpZiAodHlwZW9mIHBhcmVudE9iamVjdCA9PT0gJ29iamVjdCcgJiYgISFwYXJlbnRPYmplY3QpIHtcbiAgICBwYXJlbnRPYmplY3RbbGFzdEtleV0gPSB2YWx1ZVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRIZWFkZXIobmFtZTogc3RyaW5nLCBjdHg6IENvbnRleHQpOiBzdHJpbmcgfCBudWxsIHtcbiAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKGN0eC5yZXF1ZXN0LmhlYWRlcnMpXG4gICAgLnJlZHVjZSgocHJldiwgW2tleSwgdmFsdWVdKSA9PiB0eXBlb2YgcHJldiA9PT0gJ3N0cmluZydcbiAgICAgID8gcHJldlxuICAgICAgOiAoa2V5LnRvTG93ZXJDYXNlKCkgPT09IG5hbWUudG9Mb3dlckNhc2UoKSAmJiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgPyB2YWx1ZVxuICAgICAgICAgIDogbnVsbCksIG51bGwgYXMgc3RyaW5nIHwgbnVsbClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUHJlY29nbml0aXZlUmVxdWVzdChjdHg6IENvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIGdldEhlYWRlcigncHJlY29nbml0aW9uJywgY3R4KSA9PT0gJ3RydWUnXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcmVjb2duaXRpdmVLZXlzKGN0eDogQ29udGV4dCk6IHN0cmluZ1tdIHwgbnVsbCB7XG4gIGNvbnN0IGtleXMgPSBnZXRIZWFkZXIoJ1ByZWNvZ25pdGlvbi1WYWxpZGF0ZS1Pbmx5JywgY3R4KVxuICByZXR1cm4ga2V5cyA/IGtleXMuc3BsaXQoJywnKS5tYXAoa2V5ID0+IGtleS50cmltKCkpIDogbnVsbFxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xlYW5TdHJpbmcodmFsdWU6IHN0cmluZywgb3B0aW9ucz86IHtcbiAgdHJpbT86IGJvb2xlYW5cbiAgYWxsb3dFbXB0eVN0cmluZz86IGJvb2xlYW5cbn0pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKG9wdGlvbnM/LnRyaW0gPT09IGZhbHNlKVxuICAgIHJldHVybiB2YWx1ZVxuXG4gIGxldCBwYXJzZWQ6IHN0cmluZyB8IG51bGwgPSB2YWx1ZS50cmltKClcblxuICBpZiAob3B0aW9ucz8uYWxsb3dFbXB0eVN0cmluZylcbiAgICByZXR1cm4gcGFyc2VkXG5cbiAgaWYgKHBhcnNlZCA9PT0gJycpXG4gICAgcGFyc2VkID0gbnVsbFxuXG4gIHJldHVybiBwYXJzZWRcbn1cbiIsImltcG9ydCB0eXBlIHsgRnVsbFJ1bGUsIFJ1bGUgfSBmcm9tICcuL3R5cGVzJ1xuaW1wb3J0IHsgdXRpbCB9IGZyb20gJ0Bhd3MtYXBwc3luYy91dGlscydcbmltcG9ydCB7IGlzQXJyYXkgfSBmcm9tICcuL3V0aWxzJ1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2U8VD4odmFsdWU6IFQsIHJ1bGU6IEZ1bGxSdWxlKTogUnVsZTxUPiB7XG4gIGNvbnN0IFtuYW1lLCAuLi5wYXJhbXNdID0gdHlwZW9mIHJ1bGUgPT09ICdzdHJpbmcnXG4gICAgPyBbcnVsZSwgdW5kZWZpbmVkXVxuICAgIDogW3J1bGVbMF0sIC4uLnJ1bGUuc2xpY2UoMSldXG5cbiAgc3dpdGNoIChuYW1lKSB7XG4gICAgY2FzZSAncmVxdWlyZWQnOlxuICAgICAgcmV0dXJuIHJlcXVpcmVkUnVsZSh2YWx1ZSlcbiAgICBjYXNlICdudWxsYWJsZSc6XG4gICAgICByZXR1cm4gbnVsbGFibGVSdWxlKHZhbHVlKVxuICAgIGNhc2UgJ3NvbWV0aW1lcyc6XG4gICAgICByZXR1cm4gc29tZXRpbWVzUnVsZSh2YWx1ZSlcbiAgICBjYXNlICdtaW4nOlxuICAgICAgcmV0dXJuIG1pblJ1bGUodmFsdWUsIChwYXJhbXNbMF0hIGFzIG51bWJlcikpXG4gICAgY2FzZSAnbWF4JzpcbiAgICAgIHJldHVybiBtYXhSdWxlKHZhbHVlLCAocGFyYW1zWzBdIGFzIG51bWJlcikpXG4gICAgY2FzZSAnYmV0d2Vlbic6XG4gICAgICByZXR1cm4gYmV0d2VlblJ1bGUodmFsdWUsIChwYXJhbXNbMF0gYXMgbnVtYmVyKSwgcGFyYW1zWzFdIGFzIG51bWJlcilcbiAgICBjYXNlICdlbWFpbCc6XG4gICAgICByZXR1cm4gZW1haWxSdWxlKHZhbHVlKVxuICAgIGNhc2UgJ3VybCc6XG4gICAgICByZXR1cm4gdXJsUnVsZSh2YWx1ZSlcbiAgICBjYXNlICd1dWlkJzpcbiAgICAgIHJldHVybiB1dWlkUnVsZSh2YWx1ZSlcbiAgICBjYXNlICd1bGlkJzpcbiAgICAgIHJldHVybiB1bGlkUnVsZSh2YWx1ZSlcbiAgICBjYXNlICdyZWdleCc6XG4gICAgICByZXR1cm4gcmVnZXhSdWxlKHZhbHVlLCBwYXJhbXNbMF0gYXMgc3RyaW5nKVxuICAgIGNhc2UgJ2luJzpcbiAgICAgIHJldHVybiBpblJ1bGUodmFsdWUsIC4uLnBhcmFtcylcbiAgICBjYXNlICdub3RJbic6XG4gICAgICByZXR1cm4gbm90SW5SdWxlKHZhbHVlLCAuLi5wYXJhbXMpXG4gICAgY2FzZSAnYXJyYXknOlxuICAgICAgcmV0dXJuIGFycmF5UnVsZSh2YWx1ZSlcbiAgICBjYXNlICdvYmplY3QnOlxuICAgICAgcmV0dXJuIG9iamVjdFJ1bGUodmFsdWUpXG4gICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICByZXR1cm4gYm9vbGVhblJ1bGUodmFsdWUpXG4gICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgIHJldHVybiBudW1iZXJSdWxlKHZhbHVlKVxuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gc3RyaW5nUnVsZSh2YWx1ZSlcbiAgICBjYXNlICdkYXRlJzpcbiAgICAgIHJldHVybiBkYXRlUnVsZSh2YWx1ZSlcbiAgICBjYXNlICdiZWZvcmUnOlxuICAgICAgcmV0dXJuIGJlZm9yZVJ1bGUodmFsdWUsIHBhcmFtc1swXSBhcyBzdHJpbmcpXG4gICAgY2FzZSAnYWZ0ZXInOlxuICAgICAgcmV0dXJuIGFmdGVyUnVsZSh2YWx1ZSwgcGFyYW1zWzBdIGFzIHN0cmluZylcbiAgICBjYXNlICdiZWZvcmVPckVxdWFsJzpcbiAgICAgIHJldHVybiBiZWZvcmVPckVxdWFsUnVsZSh2YWx1ZSwgcGFyYW1zWzBdIGFzIHN0cmluZylcbiAgICBjYXNlICdhZnRlck9yRXF1YWwnOlxuICAgICAgcmV0dXJuIGFmdGVyT3JFcXVhbFJ1bGUodmFsdWUsIHBhcmFtc1swXSBhcyBzdHJpbmcpXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB7IGNoZWNrOiBmYWxzZSwgbWVzc2FnZTogYFVua25vd24gcnVsZSAke25hbWV9YCwgdmFsdWUgfVxuICB9XG59XG5cbmZ1bmN0aW9uIG1pblJ1bGU8VD4odmFsdWU6IFQsIG1pblZhbHVlOiBudW1iZXIpOiBSdWxlPFQ+IHtcbiAgY29uc3QgcmVzdWx0OiBSdWxlPFQ+ID0ge1xuICAgIGNoZWNrOiBmYWxzZSxcbiAgICBtZXNzYWdlOiBgOmF0dHJpYnV0ZSBtdXN0IGJlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byAke21pblZhbHVlfWAsXG4gICAgdmFsdWUsXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICByZXN1bHQuY2hlY2sgPSB2YWx1ZSA+PSBtaW5WYWx1ZVxuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmVzdWx0LmNoZWNrID0gdmFsdWUubGVuZ3RoID49IG1pblZhbHVlXG4gIH1cbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmVzdWx0LmNoZWNrID0gdmFsdWUubGVuZ3RoID49IG1pblZhbHVlXG4gICAgcmVzdWx0Lm1lc3NhZ2UgPSBgQXJyYXkgbXVzdCBjb250YWluIGF0IGxlYXN0ICR7bWluVmFsdWV9IGVsZW1lbnRzYFxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gbWF4UnVsZTxUPih2YWx1ZTogVCwgbWF4VmFsdWU6IG51bWJlcik6IFJ1bGU8VD4ge1xuICBjb25zdCByZXN1bHQ6IFJ1bGU8VD4gPSB7XG4gICAgY2hlY2s6IGZhbHNlLFxuICAgIG1lc3NhZ2U6IGA6YXR0cmlidXRlIG11c3QgYmUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvICR7bWF4VmFsdWV9YCxcbiAgICB2YWx1ZSxcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgcmVzdWx0LmNoZWNrID0gdmFsdWUgPD0gbWF4VmFsdWVcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJlc3VsdC5jaGVjayA9IHZhbHVlLmxlbmd0aCA8PSBtYXhWYWx1ZVxuICAgIHJlc3VsdC5tZXNzYWdlID0gYFN0cmluZyBtdXN0IGNvbnRhaW4gYXQgbW9zdCAke21heFZhbHVlfSBjaGFyYWN0ZXJzYFxuICB9XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIHJlc3VsdC5jaGVjayA9IHZhbHVlLmxlbmd0aCA8PSBtYXhWYWx1ZVxuICAgIHJlc3VsdC5tZXNzYWdlID0gYEFycmF5IG11c3QgY29udGFpbiBhdCBtb3N0ICR7bWF4VmFsdWV9IGVsZW1lbnRzYFxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gYmV0d2VlblJ1bGU8VD4odmFsdWU6IFQsIG1pblZhbHVlOiBudW1iZXIsIG1heFZhbHVlOiBudW1iZXIpOiBSdWxlPFQ+IHtcbiAgY29uc3QgcmVzdWx0OiBSdWxlPFQ+ID0ge1xuICAgIGNoZWNrOiBmYWxzZSxcbiAgICBtZXNzYWdlOiBgOmF0dHJpYnV0ZSBtdXN0IGJlIGJldHdlZW4gJHttaW5WYWx1ZX0gYW5kICR7bWF4VmFsdWV9YCxcbiAgICB2YWx1ZSxcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHJlc3VsdC5jaGVjayA9IHZhbHVlID49IG1pblZhbHVlICYmIHZhbHVlIDw9IG1heFZhbHVlXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXN1bHQuY2hlY2sgPSB2YWx1ZS5sZW5ndGggPj0gbWluVmFsdWUgJiYgdmFsdWUubGVuZ3RoIDw9IG1heFZhbHVlXG4gICAgcmVzdWx0Lm1lc3NhZ2UgPSBgU3RyaW5nIG11c3QgY29udGFpbiBiZXR3ZWVuICR7bWluVmFsdWV9IGFuZCAke21heFZhbHVlfSBjaGFyYWN0ZXJzYFxuICB9XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIHJlc3VsdC5jaGVjayA9IHZhbHVlLmxlbmd0aCA+PSBtaW5WYWx1ZSAmJiB2YWx1ZS5sZW5ndGggPD0gbWF4VmFsdWVcbiAgICByZXN1bHQubWVzc2FnZSA9IGBBcnJheSBtdXN0IGNvbnRhaW4gYmV0d2VlbiAke21pblZhbHVlfSBhbmQgJHttYXhWYWx1ZX0gZWxlbWVudHNgXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBlbWFpbFJ1bGU8VD4odmFsdWU6IFQpOiBSdWxlPFQ+IHtcbiAgY29uc3QgcmVzdWx0OiBSdWxlPFQ+ID0ge1xuICAgIGNoZWNrOiBmYWxzZSxcbiAgICBtZXNzYWdlOiAnOmF0dHJpYnV0ZSBtdXN0IGJlIGEgdmFsaWQgZW1haWwgYWRkcmVzcycsXG4gICAgdmFsdWUsXG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJlc3VsdC5jaGVjayA9IHV0aWwubWF0Y2hlcygnXlthLXpBLVowLTkuXyUrLV0rQFthLXpBLVowLTkuLV0rXFxcXC5bYS16QS1aXXsyLH0kJywgcmVzdWx0LnZhbHVlIGFzIHN0cmluZylcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIHVybFJ1bGU8VD4odmFsdWU6IFQpOiBSdWxlPFQ+IHtcbiAgY29uc3QgcmVzdWx0ID0ge1xuICAgIGNoZWNrOiBmYWxzZSxcbiAgICBtZXNzYWdlOiAnOmF0dHJpYnV0ZSBtdXN0IGJlIGEgdmFsaWQgVVJMJyxcbiAgICB2YWx1ZSxcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJlc3VsdC5jaGVjayA9IHV0aWwubWF0Y2hlcyhcbiAgICAgICdeaHR0cHM/OlxcXFwvXFxcXC8od3d3XFxcXC4pP1stYS16QS1aMC05QDolLl9cXFxcK34jPV17MSwyNTZ9XFxcXC5bYS16QS1aMC05KCldezEsNn1cXFxcYihbLWEtekEtWjAtOSgpQDolX1xcXFwrLn4jPyYvLz1dKikkfF5odHRwcz86XFxcXC9cXFxcLyhsb2NhbGhvc3R8XFxcXGR7MSwzfVxcXFwuXFxcXGR7MSwzfVxcXFwuXFxcXGR7MSwzfVxcXFwuXFxcXGR7MSwzfSkoOlxcXFxkKyk/KFxcXFwvLiopPyQnLFxuICAgICAgcmVzdWx0LnZhbHVlIGFzIHN0cmluZyxcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiB1dWlkUnVsZTxUPih2YWx1ZTogVCk6IFJ1bGU8VD4ge1xuICBjb25zdCByZXN1bHQ6IFJ1bGU8VD4gPSB7XG4gICAgY2hlY2s6IGZhbHNlLFxuICAgIG1lc3NhZ2U6ICc6YXR0cmlidXRlIG11c3QgYmUgYSB2YWxpZCBVVUlEJyxcbiAgICB2YWx1ZSxcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJlc3VsdC5jaGVjayA9IHV0aWwubWF0Y2hlcyhcbiAgICAgICdeWzAtOWEtZl17OH0tWzAtOWEtZl17NH0tWzEtNV1bMC05YS1mXXszfS1bODlhYl1bMC05YS1mXXszfS1bMC05YS1mXXsxMn0kJyxcbiAgICAgIHZhbHVlIGFzIHN0cmluZyxcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiB1bGlkUnVsZTxUPih2YWx1ZTogVCk6IFJ1bGU8VD4ge1xuICBjb25zdCByZXN1bHQ6IFJ1bGU8VD4gPSB7XG4gICAgY2hlY2s6IGZhbHNlLFxuICAgIG1lc3NhZ2U6ICc6YXR0cmlidXRlIG11c3QgYmUgYSB2YWxpZCBVTElEJyxcbiAgICB2YWx1ZSxcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIC8vIFVMSUQgZm9ybWF0OiAyNiBjaGFyYWN0ZXJzLCBiYXNlMzIgZW5jb2RlZCAoMC05LCBBLVogZXhjbHVkaW5nIEksIEwsIE8sIFUpXG4gICAgcmVzdWx0LmNoZWNrID0gdXRpbC5tYXRjaGVzKFxuICAgICAgJ15bMDEyMzQ1Njc4OUFCQ0RFRkdISktNTlBRUlNUVldYWVpdezI2fSQnLFxuICAgICAgdmFsdWUgYXMgc3RyaW5nLFxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIHJlZ2V4UnVsZTxUPih2YWx1ZTogVCwgcGF0dGVybjogc3RyaW5nKTogUnVsZTxUPiB7XG4gIGNvbnN0IHJlc3VsdDogUnVsZTxUPiA9IHtcbiAgICBjaGVjazogZmFsc2UsXG4gICAgbWVzc2FnZTogJzphdHRyaWJ1dGUgbXVzdCBtYXRjaCB0aGUgc3BlY2lmaWVkIHJlZ3VsYXIgZXhwcmVzc2lvbicsXG4gICAgdmFsdWUsXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXN1bHQudmFsdWUgPSB2YWx1ZS50cmltKCkgYXMgVFxuICAgIHJlc3VsdC5jaGVjayA9IHV0aWwubWF0Y2hlcyhwYXR0ZXJuLCByZXN1bHQudmFsdWUgYXMgc3RyaW5nKVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gaW5SdWxlPFQ+KHZhbHVlOiBULCAuLi5wYXJhbXM6IHVua25vd25bXSk6IFJ1bGU8VD4ge1xuICByZXR1cm4ge1xuICAgIGNoZWNrOiBwYXJhbXMuaW5jbHVkZXModmFsdWUpLFxuICAgIG1lc3NhZ2U6ICc6YXR0cmlidXRlIG11c3QgYmUgb25lIG9mIHRoZSBzcGVjaWZpZWQgdmFsdWVzJyxcbiAgICB2YWx1ZSxcbiAgfVxufVxuXG5mdW5jdGlvbiBub3RJblJ1bGU8VD4odmFsdWU6IFQsIC4uLnBhcmFtczogdW5rbm93bltdKTogUnVsZTxUPiB7XG4gIHJldHVybiB7XG4gICAgY2hlY2s6ICFwYXJhbXMuaW5jbHVkZXModmFsdWUpLFxuICAgIG1lc3NhZ2U6ICc6YXR0cmlidXRlIG11c3Qgbm90IGJlIG9uZSBvZiB0aGUgc3BlY2lmaWVkIHZhbHVlcycsXG4gICAgdmFsdWUsXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlcXVpcmVkUnVsZTxUPih2YWx1ZTogVCk6IFJ1bGU8VD4ge1xuICBjb25zdCByZXN1bHQ6IFJ1bGU8VD4gPSB7XG4gICAgY2hlY2s6IHRydWUsXG4gICAgbWVzc2FnZTogJzphdHRyaWJ1dGUgaXMgcmVxdWlyZWQnLFxuICAgIHZhbHVlLFxuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmVzdWx0LmNoZWNrID0gdmFsdWUubGVuZ3RoID4gMFxuICB9XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIHJlc3VsdC5jaGVjayA9IHZhbHVlLmxlbmd0aCA+IDBcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHJlc3VsdC5jaGVjayA9IHRydWVcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpIHtcbiAgICByZXN1bHQuY2hlY2sgPSB0cnVlXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgIXJlc3VsdC52YWx1ZSkge1xuICAgIHJlc3VsdC5tZXNzYWdlID0gJzphdHRyaWJ1dGUgaXMgbm90IG51bGxhYmxlJ1xuICAgIHJlc3VsdC5jaGVjayA9IGZhbHNlXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXN1bHQuY2hlY2sgPSBmYWxzZVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gbnVsbGFibGVSdWxlPFQ+KHZhbHVlOiBUKTogUnVsZTxUPiB7XG4gIGNvbnN0IHJlc3VsdDogUnVsZTxUPiA9IHtcbiAgICBjaGVjazogdHJ1ZSxcbiAgICBtZXNzYWdlOiAnJyxcbiAgICB2YWx1ZSxcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIHNvbWV0aW1lc1J1bGU8VD4odmFsdWU6IFQpOiBSdWxlPFQ+IHtcbiAgY29uc3QgcmVzdWx0OiBSdWxlPFQ+ID0ge1xuICAgIGNoZWNrOiB0cnVlLFxuICAgIG1lc3NhZ2U6ICcnLFxuICAgIHZhbHVlLFxuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmICFyZXN1bHQudmFsdWUpIHtcbiAgICByZXN1bHQubWVzc2FnZSA9ICc6YXR0cmlidXRlIGlzIG5vdCBudWxsYWJsZSdcbiAgICByZXN1bHQuY2hlY2sgPSBmYWxzZVxuICB9XG4gIHJldHVybiByZXF1aXJlZFJ1bGUodmFsdWUpXG59XG5cbmZ1bmN0aW9uIGFycmF5UnVsZTxUPih2YWx1ZTogVCk6IFJ1bGU8VD4ge1xuICBjb25zdCByZXN1bHQ6IFJ1bGU8VD4gPSB7XG4gICAgY2hlY2s6IGZhbHNlLFxuICAgIG1lc3NhZ2U6ICc6YXR0cmlidXRlIG11c3QgYmUgYW4gYXJyYXknLFxuICAgIHZhbHVlLFxuICB9XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIHJlc3VsdC5jaGVjayA9IHRydWVcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIG9iamVjdFJ1bGU8VD4odmFsdWU6IFQpOiBSdWxlPFQ+IHtcbiAgY29uc3QgcmVzdWx0OiBSdWxlPFQ+ID0ge1xuICAgIGNoZWNrOiBmYWxzZSxcbiAgICBtZXNzYWdlOiAnOmF0dHJpYnV0ZSBtdXN0IGJlIGFuIG9iamVjdCcsXG4gICAgdmFsdWUsXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgIWlzQXJyYXkocmVzdWx0LnZhbHVlKSkge1xuICAgIHJlc3VsdC5jaGVjayA9IHRydWVcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIGJvb2xlYW5SdWxlPFQ+KHZhbHVlOiBUKTogUnVsZTxUPiB7XG4gIGNvbnN0IHJlc3VsdDogUnVsZTxUPiA9IHtcbiAgICBjaGVjazogZmFsc2UsXG4gICAgbWVzc2FnZTogJzphdHRyaWJ1dGUgbXVzdCBiZSBhIGJvb2xlYW4nLFxuICAgIHZhbHVlLFxuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykge1xuICAgIHJlc3VsdC5jaGVjayA9IHRydWVcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIG51bWJlclJ1bGU8VD4odmFsdWU6IFQpOiBSdWxlPFQ+IHtcbiAgY29uc3QgcmVzdWx0OiBSdWxlPFQ+ID0ge1xuICAgIGNoZWNrOiBmYWxzZSxcbiAgICBtZXNzYWdlOiAnOmF0dHJpYnV0ZSBtdXN0IGJlIGEgbnVtYmVyJyxcbiAgICB2YWx1ZSxcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHJlc3VsdC5jaGVjayA9IHRydWVcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIHN0cmluZ1J1bGU8VD4odmFsdWU6IFQpOiBSdWxlPFQ+IHtcbiAgY29uc3QgcmVzdWx0OiBSdWxlPFQ+ID0ge1xuICAgIGNoZWNrOiBmYWxzZSxcbiAgICBtZXNzYWdlOiAnOmF0dHJpYnV0ZSBtdXN0IGJlIGEgc3RyaW5nJyxcbiAgICB2YWx1ZSxcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJlc3VsdC5jaGVjayA9IHRydWVcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIGRhdGVSdWxlPFQ+KHZhbHVlOiBUKTogUnVsZTxUPiB7XG4gIGNvbnN0IHJlc3VsdDogUnVsZTxUPiA9IHtcbiAgICBjaGVjazogZmFsc2UsXG4gICAgbWVzc2FnZTogJzphdHRyaWJ1dGUgbXVzdCBiZSBhIGRhdGUnLFxuICAgIHZhbHVlLFxuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmVzdWx0LmNoZWNrID0gdXRpbC5tYXRjaGVzKFxuICAgICAgJ15cXFxcZHs0fS0oMFsxLTldfDFbMC0yXSktKDBbMS05XXxbMTJdXFxcXGR8M1swMV0pVChbMDFdXFxcXGR8MlswLTNdKTpbMC01XVxcXFxkOlswLTVdXFxcXGQoXFxcXC5cXFxcZHsxLDZ9KT9aJCcsXG4gICAgICByZXN1bHQudmFsdWUgYXMgc3RyaW5nLFxuICAgIClcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHJlc3VsdC5jaGVjayA9IHRydWVcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIGJlZm9yZVJ1bGU8VD4odmFsdWU6IFQsIHN0YXJ0OiBzdHJpbmcpOiBSdWxlPFQ+IHtcbiAgY29uc3QgcmVzdWx0OiBSdWxlPFQ+ID0ge1xuICAgIGNoZWNrOiBmYWxzZSxcbiAgICBtZXNzYWdlOiBgOmF0dHJpYnV0ZSBtdXN0IGJlIGJlZm9yZSAke3N0YXJ0fWAsXG4gICAgdmFsdWUsXG4gIH1cbiAgY29uc3Qgc3RhcnRWYWx1ZSA9IHV0aWwudGltZS5wYXJzZUlTTzg2MDFUb0Vwb2NoTWlsbGlTZWNvbmRzKHN0YXJ0KVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgY29uc3QgZGF0ZSA9IHV0aWwudGltZS5wYXJzZUlTTzg2MDFUb0Vwb2NoTWlsbGlTZWNvbmRzKHZhbHVlKVxuICAgIHJlc3VsdC5jaGVjayA9IGRhdGUgPCBzdGFydFZhbHVlXG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHJlc3VsdC5jaGVjayA9IHZhbHVlIDwgc3RhcnRWYWx1ZVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gYWZ0ZXJSdWxlPFQ+KHZhbHVlOiBULCBzdGFydDogc3RyaW5nKTogUnVsZTxUPiB7XG4gIGNvbnN0IHJlc3VsdDogUnVsZTxUPiA9IHtcbiAgICBjaGVjazogZmFsc2UsXG4gICAgbWVzc2FnZTogYDphdHRyaWJ1dGUgbXVzdCBiZSBhZnRlciAke3N0YXJ0fWAsXG4gICAgdmFsdWUsXG4gIH1cbiAgY29uc3Qgc3RhcnRWYWx1ZSA9IHV0aWwudGltZS5wYXJzZUlTTzg2MDFUb0Vwb2NoTWlsbGlTZWNvbmRzKHN0YXJ0KVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgY29uc3QgZGF0ZSA9IHV0aWwudGltZS5wYXJzZUlTTzg2MDFUb0Vwb2NoTWlsbGlTZWNvbmRzKHZhbHVlKVxuICAgIHJlc3VsdC5jaGVjayA9IGRhdGUgPiBzdGFydFZhbHVlXG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHJlc3VsdC5jaGVjayA9IHZhbHVlID4gc3RhcnRWYWx1ZVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gYmVmb3JlT3JFcXVhbFJ1bGU8VD4odmFsdWU6IFQsIHN0YXJ0OiBzdHJpbmcpOiBSdWxlPFQ+IHtcbiAgY29uc3QgcmVzdWx0OiBSdWxlPFQ+ID0ge1xuICAgIGNoZWNrOiBmYWxzZSxcbiAgICBtZXNzYWdlOiBgOmF0dHJpYnV0ZSBtdXN0IGJlIGJlZm9yZSBvciBlcXVhbCB0byAke3N0YXJ0fWAsXG4gICAgdmFsdWUsXG4gIH1cbiAgY29uc3Qgc3RhcnRWYWx1ZSA9IHV0aWwudGltZS5wYXJzZUlTTzg2MDFUb0Vwb2NoTWlsbGlTZWNvbmRzKHN0YXJ0KVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgY29uc3QgZGF0ZSA9IHV0aWwudGltZS5wYXJzZUlTTzg2MDFUb0Vwb2NoTWlsbGlTZWNvbmRzKHZhbHVlKVxuICAgIHJlc3VsdC5jaGVjayA9IGRhdGUgPD0gc3RhcnRWYWx1ZVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICByZXN1bHQuY2hlY2sgPSB2YWx1ZSA8PSBzdGFydFZhbHVlXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBhZnRlck9yRXF1YWxSdWxlPFQ+KHZhbHVlOiBULCBzdGFydDogc3RyaW5nKTogUnVsZTxUPiB7XG4gIGNvbnN0IHJlc3VsdDogUnVsZTxUPiA9IHtcbiAgICBjaGVjazogZmFsc2UsXG4gICAgbWVzc2FnZTogYDphdHRyaWJ1dGUgbXVzdCBiZSBhZnRlciBvciBlcXVhbCB0byAke3N0YXJ0fWAsXG4gICAgdmFsdWUsXG4gIH1cbiAgY29uc3Qgc3RhcnRWYWx1ZSA9IHV0aWwudGltZS5wYXJzZUlTTzg2MDFUb0Vwb2NoTWlsbGlTZWNvbmRzKHN0YXJ0KVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgY29uc3QgZGF0ZSA9IHV0aWwudGltZS5wYXJzZUlTTzg2MDFUb0Vwb2NoTWlsbGlTZWNvbmRzKHZhbHVlKVxuICAgIHJlc3VsdC5jaGVjayA9IGRhdGUgPj0gc3RhcnRWYWx1ZVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICByZXN1bHQuY2hlY2sgPSB2YWx1ZSA+PSBzdGFydFZhbHVlXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuIiwiaW1wb3J0IHR5cGUgeyBDb250ZXh0IH0gZnJvbSAnQGF3cy1hcHBzeW5jL3V0aWxzJ1xuaW1wb3J0IHR5cGUgeyBGdWxsUnVsZSwgTmVzdGVkS2V5T2YsIFJ1bGUgfSBmcm9tICcuL3R5cGVzJ1xuaW1wb3J0IHsgcnVudGltZSwgdXRpbCB9IGZyb20gJ0Bhd3MtYXBwc3luYy91dGlscydcbmltcG9ydCAqIGFzIHJ1bGVzIGZyb20gJy4vcnVsZXMnXG5pbXBvcnQgeyBjbGVhblN0cmluZywgZ2V0TmVzdGVkVmFsdWUsIGlzQXJyYXksIGlzUHJlY29nbml0aXZlUmVxdWVzdCwgcHJlY29nbml0aXZlS2V5cywgc2V0TmVzdGVkVmFsdWUgfSBmcm9tICcuL3V0aWxzJ1xuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGU8VCBleHRlbmRzIG9iamVjdD4oXG4gIG9iajogVCxcbiAgY2hlY2tzOiBQYXJ0aWFsPFJlY29yZDxOZXN0ZWRLZXlPZjxUPiwgKEZ1bGxSdWxlIHwgUnVsZSlbXT4+LFxuICBvcHRpb25zPzoge1xuICAgIHRyaW0/OiBib29sZWFuXG4gICAgYWxsb3dFbXB0eVN0cmluZz86IGJvb2xlYW5cbiAgfSxcbik6IFQge1xuICBsZXQgZXJyb3I6IHsgbXNnPzogc3RyaW5nLCBlcnJvclR5cGU/OiBzdHJpbmcsIGRhdGE/OiBhbnksIGVycm9ySW5mbz86IGFueSB9ID0ge31cblxuICBPYmplY3Qua2V5cyhjaGVja3MpLmZvckVhY2goKHBhdGgpID0+IHtcbiAgICBsZXQgdmFsdWUgPSBnZXROZXN0ZWRWYWx1ZShvYmosIHBhdGggYXMgTmVzdGVkS2V5T2Y8VD4pXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gY2xlYW5TdHJpbmcodmFsdWUsIG9wdGlvbnMpXG4gICAgICBzZXROZXN0ZWRWYWx1ZShvYmosIHBhdGggYXMgTmVzdGVkS2V5T2Y8VD4sIHZhbHVlKVxuICAgIH1cblxuICAgIGxldCBza2lwID0gZmFsc2VcbiAgICBjaGVja3NbcGF0aCBhcyBOZXN0ZWRLZXlPZjxUPl0/LmZvckVhY2goKHJ1bGUpID0+IHtcbiAgICAgIGlmIChza2lwKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBpZiAocnVsZSA9PT0gJ251bGxhYmxlJyAmJiB2YWx1ZSA9PT0gbnVsbClcbiAgICAgICAgc2tpcCA9IHRydWVcblxuICAgICAgaWYgKHJ1bGUgPT09ICdzb21ldGltZXMnICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgIHNraXAgPSB0cnVlXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9ICh0eXBlb2YgcnVsZSA9PT0gJ3N0cmluZycgfHwgaXNBcnJheShydWxlKSlcbiAgICAgICAgPyBydWxlcy5wYXJzZSh2YWx1ZSwgcnVsZSlcbiAgICAgICAgOiB7IC4uLnJ1bGUgfVxuXG4gICAgICBpZiAocmVzdWx0LmNoZWNrKVxuICAgICAgICByZXR1cm5cblxuICAgICAgaWYgKGVycm9yLm1zZylcbiAgICAgICAgdXRpbC5hcHBlbmRFcnJvcihlcnJvci5tc2csIGVycm9yLmVycm9yVHlwZSwgZXJyb3IuZGF0YSwgZXJyb3IuZXJyb3JJbmZvKVxuXG4gICAgICByZXN1bHQubWVzc2FnZSA9IHJlc3VsdC5tZXNzYWdlLnJlcGxhY2UoJzphdHRyaWJ1dGUnLCBmb3JtYXRBdHRyaWJ1dGVOYW1lKHBhdGgpKVxuICAgICAgZXJyb3IgPSB7XG4gICAgICAgIG1zZzogcmVzdWx0Lm1lc3NhZ2UsXG4gICAgICAgIGVycm9yVHlwZTogJ1ZhbGlkYXRpb25FcnJvcicsXG4gICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIGVycm9ySW5mbzogeyBwYXRoLCB2YWx1ZSB9LFxuICAgICAgfVxuXG4gICAgICBza2lwID0gdHJ1ZVxuICAgIH0pXG4gIH0pXG5cbiAgaWYgKCFlcnJvci5tc2cpIHtcbiAgICByZXR1cm4gb2JqXG4gIH1cblxuICB1dGlsLmVycm9yKGVycm9yLm1zZywgZXJyb3IuZXJyb3JUeXBlLCBlcnJvci5kYXRhLCBlcnJvci5lcnJvckluZm8pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcmVjb2duaXRpdmVWYWxpZGF0aW9uPFQgZXh0ZW5kcyBvYmplY3Q+KFxuICBjdHg6IENvbnRleHQ8VD4sXG4gIGNoZWNrczogUGFydGlhbDxSZWNvcmQ8TmVzdGVkS2V5T2Y8VD4sIChGdWxsUnVsZSB8IFJ1bGUpW10+PixcbiAgb3B0aW9ucz86IHtcbiAgICB0cmltPzogYm9vbGVhblxuICAgIGFsbG93RW1wdHlTdHJpbmc/OiBib29sZWFuXG4gICAgc2tpcFRvPzogJ0VORCcgfCAnTkVYVCdcbiAgfSxcbik6IFQge1xuICBpZiAoIWlzUHJlY29nbml0aXZlUmVxdWVzdChjdHgpKSB7XG4gICAgcmV0dXJuIHZhbGlkYXRlKGN0eC5hcmdzLCBjaGVja3MsIG9wdGlvbnMpXG4gIH1cbiAgY29uc3QgdmFsaWRhdGlvbktleXMgPSBwcmVjb2duaXRpdmVLZXlzKGN0eClcbiAgdXRpbC5odHRwLmFkZFJlc3BvbnNlSGVhZGVyKCdQcmVjb2duaXRpb24nLCAndHJ1ZScpXG5cbiAgaWYgKCF2YWxpZGF0aW9uS2V5cykge1xuICAgIHZhbGlkYXRlKGN0eC5hcmdzLCBjaGVja3MsIG9wdGlvbnMpXG4gICAgdXRpbC5odHRwLmFkZFJlc3BvbnNlSGVhZGVyKCdQcmVjb2duaXRpb24tU3VjY2VzcycsICd0cnVlJylcbiAgICBydW50aW1lLmVhcmx5UmV0dXJuKG51bGwpXG4gIH1cblxuICB1dGlsLmh0dHAuYWRkUmVzcG9uc2VIZWFkZXIoJ1ByZWNvZ25pdGlvbi1WYWxpZGF0ZS1Pbmx5JywgdmFsaWRhdGlvbktleXMuam9pbignLCcpKVxuICBjb25zdCBwcmVjb2duaXRpb25DaGVja3MgPSB7fSBhcyBQYXJ0aWFsPHR5cGVvZiBjaGVja3M+XG4gIHZhbGlkYXRpb25LZXlzLmZvckVhY2goKGtleSkgPT4ge1xuICAgIHByZWNvZ25pdGlvbkNoZWNrc1trZXkgYXMgTmVzdGVkS2V5T2Y8VD5dID0gY2hlY2tzW2tleSBhcyBOZXN0ZWRLZXlPZjxUPl1cbiAgfSlcblxuICB2YWxpZGF0ZShjdHguYXJncywgcHJlY29nbml0aW9uQ2hlY2tzLCBvcHRpb25zKVxuICB1dGlsLmh0dHAuYWRkUmVzcG9uc2VIZWFkZXIoJ1ByZWNvZ25pdGlvbi1TdWNjZXNzJywgJ3RydWUnKVxuICBydW50aW1lLmVhcmx5UmV0dXJuKG51bGwsIHsgc2tpcFRvOiBvcHRpb25zPy5za2lwVG8gPz8gJ0VORCcgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEF0dHJpYnV0ZU5hbWUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHBhdGguc3BsaXQoJy4nKS5yZWR1Y2UoKGFjYywgcGFydCkgPT4ge1xuICAgIGlmICh1dGlsLm1hdGNoZXMoJ15cXGQrJCcsIHBhcnQpKSB7XG4gICAgICByZXR1cm4gYWNjXG4gICAgfVxuICAgIHJldHVybiBhY2MgPyBgJHthY2N9ICR7cGFydC50b0xvd2VyQ2FzZSgpfWAgOiBwYXJ0LnRvTG93ZXJDYXNlKClcbiAgfSwgJycpXG59XG4iXSwibWFwcGluZ3MiOiI7OztBQVFBLFNBQWdCLFFBQVEsT0FBb0M7QUFDMUQsS0FBSSxPQUFPLFVBQVUsWUFBWSxDQUFDLENBQUMsU0FBUyxPQUFPLE9BQU8sT0FBTyxTQUFTLENBQ3hFLFFBQU8sT0FBUSxNQUFvQixXQUFXO0FBRWhELFFBQU87O0FBR1QsU0FBZ0IsZUFBaUMsS0FBUSxNQUEyQjtBQUNsRixRQUFPLEtBQUssTUFBTSxJQUFJLENBQUMsUUFBaUIsU0FBUyxRQUFRLEtBQUssUUFBUSxRQUFTLElBQUksR0FDOUUsUUFBc0IsT0FBTyxJQUFJLElBQ2pDLFFBQW9DLE1BQU0sSUFBSTs7QUFHckQsU0FBZ0IsZUFBaUMsS0FBUSxNQUFzQixPQUFzQjtDQUNuRyxNQUFNLE9BQU8sS0FBSyxNQUFNLElBQUk7QUFDNUIsS0FBSSxLQUFLLFdBQVcsR0FBRztBQUNyQixNQUFJLEtBQUssTUFBMEI7QUFDbkM7O0NBRUYsTUFBTSxVQUFVLEtBQUssS0FB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