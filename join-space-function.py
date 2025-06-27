from appwrite.client import Client
from appwrite.services.teams import Teams
from appwrite.exception import AppwriteException
import os
import json

def main(context):
    try:
        # Log that function started
        context.log("Function started")
        
        # Parse request body
        if not context.req.body:
            context.log("No request body")
            return context.res.json({"success": False, "error": "Request body is required"})
        
        data = json.loads(context.req.body)
        join_code = data.get("joinCode")
        user_id = data.get("userId")
        
        context.log(f"Received: joinCode={join_code}, userId={user_id}")
        
        # Simple validation
        if not join_code or not user_id:
            return context.res.json({"success": False, "error": "Join code and user ID are required"})
        
        # For now, just return success if we get here
        context.log("Function completed successfully")
        return context.res.json({
            "success": True,
            "message": "Join request processed successfully",
            "joinCode": join_code,
            "userId": user_id
        })
        
    except Exception as err:
        context.error(f"Function error: {err}")
        return context.res.json({
            "success": False,
            "error": f"Function error: {str(err)}"
        }) 