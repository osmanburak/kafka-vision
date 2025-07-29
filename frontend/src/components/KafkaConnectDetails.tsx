'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Link, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { KafkaConnector } from '@/lib/types';

interface KafkaConnectDetailsProps {
  connector: KafkaConnector;
}

export function KafkaConnectDetails({ connector }: KafkaConnectDetailsProps) {
  const [expanded, setExpanded] = useState(false);
  
  const getStateIcon = (state: string) => {
    switch (state) {
      case 'RUNNING':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'FAILED':
        return <XCircle size={14} className="text-red-500" />;
      case 'PAUSED':
        return <AlertTriangle size={14} className="text-yellow-500" />;
      default:
        return <AlertTriangle size={14} className="text-gray-500" />;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'RUNNING':
        return 'text-green-600';
      case 'FAILED':
        return 'text-red-600';
      case 'PAUSED':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="py-2 border-b border-gray-200 last:border-0">
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getStateIcon(connector.state)}
            <span className="font-medium text-sm">{connector.name}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            <span className={`font-medium ${getStateColor(connector.state)}`}>
              {connector.state}
            </span>
            {connector.totalTasks !== undefined && (
              <span className="ml-2">
                {connector.runningTasks}/{connector.totalTasks} tasks running
              </span>
            )}
          </div>
        </div>
        <div className="ml-2">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 bg-gray-50 rounded p-3">
          {/* Connector Info */}
          <div className="mb-3">
            <div className="text-sm font-medium mb-2 flex items-center">
              <Link size={14} className="mr-1" />
              Connector Details
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Type: {connector.type || 'Unknown'}</div>
              <div>Worker: {connector.workerId || 'N/A'}</div>
              <div>State: <span className={`font-medium ${getStateColor(connector.state)}`}>{connector.state}</span></div>
            </div>
          </div>

          {/* Tasks Status */}
          {connector.tasks && connector.tasks.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">
                Tasks ({connector.tasks.length})
              </div>
              <div className="space-y-1">
                {connector.tasks.map((task) => (
                  <div key={task.id} className="text-xs bg-white rounded p-2 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStateIcon(task.state)}
                        <span className="font-medium">Task {task.id}</span>
                      </div>
                      <span className={`font-medium ${getStateColor(task.state)}`}>
                        {task.state}
                      </span>
                    </div>
                    <div className="text-gray-600 mt-1">
                      Worker: {task.workerId}
                    </div>
                    {task.trace && task.state === 'FAILED' && (
                      <div className="text-red-600 mt-1 text-xs font-mono bg-red-50 p-1 rounded">
                        {task.trace.substring(0,100)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task Summary */}
          {connector.totalTasks !== undefined && (
            <div className="mt-3 text-xs text-gray-600 grid grid-cols-3 gap-2">
              <div>Total: {connector.totalTasks}</div>
              <div className="text-green-600">Running: {connector.runningTasks || 0}</div>
              <div className="text-red-600">Failed: {connector.failedTasks || 0}</div>
            </div>
          )}
        </div>
      )}
      
      {connector.error && (
        <div className="text-xs text-red-500 mt-1">{connector.error}</div>
      )}
    </div>
  );
}